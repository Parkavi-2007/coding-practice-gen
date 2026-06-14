const Groq = require('groq-sdk')

function getClient() {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2]
  const key = keys[Math.floor(Math.random() * keys.length)]
  return new Groq({ apiKey: key })
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
    throw err
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { action } = req.query
  const body = req.body

  try {
    if (action === 'generate-list') {
      const { language, topic, difficulty } = body
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
    "starterCode": "public returnType methodName(params) {\\n    // Write your solution here\\n}",
    "testCases": [
      {"input": "input1", "expected": "output1", "explanation": "why"},
      {"input": "input2", "expected": "output2", "explanation": "why"},
      {"input": "input3", "expected": "output3", "explanation": "edge case"}
    ]
  }
]
Use only double quotes. No backticks. No extra text outside JSON.`
      }], 2000)
      return res.json(parseJSON(text))
    }

    if (action === 'hint') {
      const { language, problemTitle, problemDescription } = body
      const text = await callGroq([{
        role: 'user',
        content: `Give ONE specific hint for this problem:
Title: ${problemTitle}
Description: ${problemDescription}
Language: ${language}
One sentence only. Do not give the solution.`
      }], 100)
      return res.json({ hint: text })
    }

    if (action === 'evaluate') {
      const { language, problemTitle, problemDescription, userCode, testCases } = body
      const text = await callGroq([{
        role: 'user',
        content: `You are a strict code evaluator. Return ONLY JSON. No code. No markdown.

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
      return res.json(parseJSON(text))
    }

    if (action === 'assessment-questions') {
      const { language } = body
      const text = await callGroq([{
        role: 'user',
       content: `Generate 10 multiple choice questions for ${language} programming assessment.
Mix topics: Arrays, Strings, Loops, Functions, OOP, Recursion, Sorting, Searching, Linked Lists, Trees
Include 3 beginner, 4 intermediate, 3 advanced questions.

STRICT RULES:
- Each question must have EXACTLY 4 options only
- Options must be the actual answer text, NOT letters like A, B, C, D
- correct must be 0, 1, 2, or 3 (index of correct option)

Return ONLY a JSON array:
[{"topic":"Arrays","level":"beginner","question":"What is the index of first element?","options":["0","1","-1","Depends"],"correct":0}]
Use only double quotes. No extra text outside JSON.`
      }], 2000)
      return res.json(parseJSON(text))
    }

    if (action === 'story') {
      const { problemTitle, problemDescription } = body
      const text = await callGroq([{
        role: 'user',
        content: `Wrap this coding problem in a simple real life story for a 10 year old:
Title: ${problemTitle}
Description: ${problemDescription}
2-3 short sentences only. No technical words.`
      }], 200)
      return res.json({ story: text })
    }

    if (action === 'why-wrong') {
      const { language, problemTitle, problemDescription, userCode, testResults } = body
      const failedTests = testResults.filter(t => !t.passed)
      const text = await callGroq([{
        role: 'user',
        content: `A student wrote this ${language} code for "${problemTitle}" but it failed.
Code: ${userCode}
Failed Tests: ${JSON.stringify(failedTests)}

Format EXACTLY like this:
❌ Bug 1: [variable/line]
→ What is wrong: [explain]
→ Why it matters: [explain]

💡 Think about: [one hint]`
      }], 400)
      return res.json({ explanation: text })
    }

    if (action === 'teach-it-back') {
      const { problemTitle, problemDescription, userExplanation, language } = body
      const text = await callGroq([{
        role: 'user',
        content: `Student solved "${problemTitle}" and explained:
"${userExplanation}"

Format EXACTLY:
SCORE: [0-100]
VERDICT: [Understood/Partially/Needs More]

✅ What you got right:
→ [point]

❌ What was missing:
→ [point]

💡 Key insight:
→ [point]`
      }], 300)
      return res.json({ result: text })
    }

    if (action === 'weekend-challenge') {
      const { language, level } = body
      const text = await callGroq([{
        role: 'user',
        content: `Generate a hard ${language} coding problem. Return ONLY valid JSON. No markdown.
{"title":"title","difficulty":"Hard","description":"one sentence","examples":"Input x Output y","constraints":"three constraints","starterCode":"empty function only","testCases":[{"input":"x","expected":"y","explanation":"why"},{"input":"a","expected":"b","explanation":"why"},{"input":"c","expected":"d","explanation":"edge"}],"badge":{"name":"Weekend Warrior","emoji":"⚔️","description":"Completed weekend challenge"}}`
      }], 1000)

      const cleaned = text
        .replace(/```json|```/g, '')
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        .replace(/`/g, "'")
        .replace(/\n/g, ' ')
        .trim()

      const start = cleaned.indexOf('{')
      const end = cleaned.lastIndexOf('}')
      return res.json(JSON.parse(cleaned.slice(start, end + 1)))
    }

    return res.status(400).json({ error: 'Invalid action' })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}