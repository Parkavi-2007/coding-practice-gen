const express = require('express')
const router = express.Router()
const { generateProblemList, generateHint, evaluateCode, generateAssessmentQuestions, generateStory, whyAmIWrong, teachItBack, generateWeekendChallenge } = require('../services/ai')
router.post('/generate-list', async (req, res) => {
  try {
    const { language, topic, difficulty } = req.body
    const problems = await generateProblemList(language, topic, difficulty)
    res.json(problems)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate problems' })
  }
})

router.post('/hint', async (req, res) => {
  try {
    const { language, topic, difficulty, problemTitle, problemDescription } = req.body
    const hint = await generateHint(language, topic, difficulty, problemTitle, problemDescription)
    res.json({ hint })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate hint' })
  }
})

router.post('/evaluate', async (req, res) => {
  try {
    const { language, problemTitle, problemDescription, starterCode, userCode, testCases } = req.body
    const result = await evaluateCode(language, problemTitle, problemDescription, starterCode, userCode, testCases)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to evaluate code' })
  }
})

router.post('/assessment-questions', async (req, res) => {
  try {
    const { language } = req.body
    const questions = await generateAssessmentQuestions(language)
    res.json(questions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate assessment questions' })
  }
})

router.post('/story', async (req, res) => {
  try {
    const { problemTitle, problemDescription, language } = req.body
    const story = await generateStory(problemTitle, problemDescription, language)
    res.json({ story })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate story' })
  }
})
router.post('/why-wrong', async (req, res) => {
  try {
    const { language, problemTitle, problemDescription, userCode, testResults } = req.body
    const explanation = await whyAmIWrong(language, problemTitle, problemDescription, userCode, testResults)
    res.json({ explanation })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to explain error' })
  }
})
router.post('/teach-it-back', async (req, res) => {
  try {
    const { problemTitle, problemDescription, userExplanation, language } = req.body
    const result = await teachItBack(problemTitle, problemDescription, userExplanation, language)
    res.json({ result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to evaluate explanation' })
  }
})
router.post('/weekend-challenge', async (req, res) => {
  try {
    const { language, level } = req.body
    const challenge = await generateWeekendChallenge(language, level)
    res.json(challenge)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate weekend challenge' })
  }
})
module.exports = router