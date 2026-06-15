require('dotenv').config()
const Groq = require('groq-sdk')

let useSecond = false

function getClient() {
  useSecond = !useSecond
  return new Groq({
    apiKey: useSecond ? process.env.GROQ_API_KEY_2 : process.env.GROQ_API_KEY,
  })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGroq(messages, maxTokens = 1000, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const completion = await getClient().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      })
      return completion.choices[0].message.content
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        console.log(`Rate limit hit, waiting 30 seconds...`)
        await sleep(30000)
      } else {
        throw err
      }
    }
  }
}

function parseJSON(text) {
  try {
    const clean = text
      .replace(/```json|```/g, '')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .replace(/`/g, "'")
      .trim()
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start !== -1 && end !== -1 && start < end) {
      return JSON.parse(clean.slice(start, end + 1))
    }
    const objStart = clean.indexOf('{')
    const objEnd = clean.lastIndexOf('}')
    if (objStart !== -1 && objEnd !== -1 && objStart < objEnd) {
      return JSON.parse(clean.slice(objStart, objEnd + 1))
    }
    throw new Error('No valid JSON found')
  } catch (err) {
    console.error('JSON parse error:', err.message)
    console.error('Raw text:', text.slice(0, 200))
    throw err
  }
}

async function generateProblemList(language, topic, difficulty) {
  const text = await callGroq([{
    role: 'user',
    content: `Generate 5 coding problems about "${topic}" in ${language} at ${difficulty} level.

Return ONLY a JSON array with exactly 5 objects:
[
  {
    "id": 1,
    "title": "problem title",
    "difficulty": "${difficulty}",
    "description": "clear problem description",
    "examples": "2 input/output examples",
    "constraints": "3 constraints",
    "starterCode": "// Write your solution here",
    "testCases": [
      {"input": "input1", "expected": "output1", "explanation": "why"},
      {"input": "input2", "expected": "output2", "explanation": "why"},
      {"input": "input3", "expected": "output3", "explanation": "edge case"}
    ]
  }
]

Important rules:
- Use only double quotes in JSON
- NO backticks anywhere in the response — not in starterCode, not in any field
- starterCode must be plain raw code only, no markdown, no triple backticks, no code fences
- Use \\n for line breaks in starterCode
- starterCode must be EMPTY with just a comment saying write your solution here
- Do NOT put any solution or logic in starterCode
- starterCode is just a blank template for the user to fill in
- starterCode must have exactly ONE opening brace and ONE closing brace
- No extra text outside the JSON array`

  }], 2000)
  return parseJSON(text)
}

async function generateHint(language, topic, difficulty, problemTitle, problemDescription) {
  const text = await callGroq([{
    role: 'user',
    content: `Give ONE specific hint for this problem:
Title: ${problemTitle}
Description: ${problemDescription}
Language: ${language}

One sentence only. Do not give the solution.`
  }], 100)
  return text
}

async function evaluateCode(language, problemTitle, problemDescription, starterCode, userCode, testCases) {
  const text = await callGroq([{
    role: 'user',
    content: `You are a code evaluator. Return ONLY JSON. No code. No markdown. No extra text.

Problem: "${problemTitle}"
Test Cases: ${JSON.stringify(testCases)}
Code: ${userCode}

RULES:
- Trace each test case step by step
- For negative numbers: -1 > -2 > -3
- Only mark passed if output exactly matches expected
- Keep ALL string values under 8 words
- YOUR RESPONSE MUST START WITH { AND END WITH }

{"passed":true,"score":100,"summary":"ok","correctness":"ok","improvements":"ok","timeComplexity":"O(n)","spaceComplexity":"O(1)","testResults":[{"input":"x","expected":"y","actual":"y","passed":true,"explanation":"ok"}]}`
  }], 1000)
  return parseJSON(text)
}

async function generateAssessmentQuestions(language) {
  const text = await callGroq([{
    role: 'user',
    content: `Generate EXACTLY 10 multiple choice questions for ${language} programming assessment.

Mix topics: Arrays, Strings, Loops, Functions, OOP, Recursion, Sorting, Searching, Linked Lists, Trees
Include 3 beginner, 4 intermediate, 3 advanced questions.

IMPORTANT RULES:
- Generate EXACTLY 10 questions, no more, no less
- If the question asks about code output, you MUST include the actual code snippet inside the question text
- Never say "what is the output of the following code" without showing the code
- Keep questions clear and self-contained
- Use only double quotes in JSON
- No extra text outside the JSON array

Return ONLY a JSON array of exactly 10 objects:
[
  {
    "topic": "Arrays",
    "level": "beginner",
    "question": "What will this code print?\\n\\nfor i in range(3):\\n    print(i)",
    "options": ["0 1 2", "1 2 3", "0 1 2 3", "Error"],
    "correct": 0
  }
]`
  }], 2500)
  const questions = parseJSON(text)
  return questions.slice(0, 10)
}
async function generateStory(problemTitle, problemDescription, language) {
  const text = await callGroq([{
    role: 'user',
    content: `Wrap this coding problem in a very simple, easy to understand real life story.
Title: ${problemTitle}
Description: ${problemDescription}

Rules:
- Use simple everyday situations (shopping, cooking, school, games)
- Explain it like talking to a 10 year old
- 2-3 short sentences only
- The story should make the problem obvious without using technical words
Return ONLY the story text, no extra formatting.`
  }], 200)
  return text
}

async function whyAmIWrong(language, problemTitle, problemDescription, userCode, testResults) {
  const failedTests = testResults.filter(t => !t.passed)
  const text = await callGroq([{
    role: 'user',
    content: `A student wrote this ${language} code for a problem but it failed some test cases.

Problem: ${problemTitle}
Description: ${problemDescription}

Student's Code:
${userCode}

Failed Test Cases:
${JSON.stringify(failedTests)}

Carefully analyze ALL bugs and format your response EXACTLY like this:

❌ Bug 1: [variable/line name]
→ What is wrong: [explain clearly what the mistake is]
→ Why it matters: [explain what goes wrong because of this mistake]

❌ Bug 2: [variable/line name]
→ What is wrong: [explain clearly what the mistake is]
→ Why it matters: [explain what goes wrong because of this mistake]

💡 Think about: [one helpful hint to guide them without giving the solution]

Find ALL bugs. Be specific. Keep language simple like talking to a beginner.`
  }], 400)
  return text
}

async function teachItBack(problemTitle, problemDescription, userExplanation, language) {
  const text = await callGroq([{
    role: 'user',
    content: `A student solved this coding problem and explained their solution in plain English.

Problem: ${problemTitle}
Description: ${problemDescription}
Language: ${language}

Student's Explanation:
"${userExplanation}"

Format your response EXACTLY like this:

SCORE: [0-100]
VERDICT: [Understood / Partially Understood / Needs More Explanation]

✅ What you got right:
→ [point 1]
→ [point 2]

❌ What was missing:
→ [point 1]

💡 Key insight you should remember:
→ [one important thing about this problem]`
  }], 300)
  return text
}

async function generateWeekendChallenge(language, level) {
  const text = await callGroq([{
    role: 'user',
    content: `Generate a hard ${language} coding problem. Return ONLY valid JSON. No markdown. No newlines inside string values.

Return this exact structure:
{"title":"problem title","difficulty":"Hard","description":"problem in one sentence","examples":"Input x Output y","constraints":"three short constraints","starterCode":"empty function only","testCases":[{"input":"x","expected":"y","explanation":"why"},{"input":"a","expected":"b","explanation":"why"},{"input":"c","expected":"d","explanation":"edge"}],"badge":{"name":"Weekend Warrior","emoji":"sword","description":"Completed weekend challenge"}}`
  }], 1000)

  const cleaned = text
    .replace(/```json|```/g, '')
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/`/g, "'")
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .trim()

  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    return JSON.parse(cleaned.slice(start, end + 1))
  }
  throw new Error('No valid JSON found')
}

module.exports = { generateProblemList, generateHint, evaluateCode, generateAssessmentQuestions, generateStory, whyAmIWrong, teachItBack, generateWeekendChallenge }