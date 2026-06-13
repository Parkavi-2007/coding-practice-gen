const KEY = 'codegen_progress'

export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {
      solvedProblems: [],
      streak: 0,
      lastSolvedDate: null,
      totalPoints: 0,
      weakTopics: {},
      strongTopics: {},
      badges: [],
      weekendChallengeHistory: [],
      dailyActivity: {},
    }
  } catch {
    return {
      solvedProblems: [],
      streak: 0,
      lastSolvedDate: null,
      totalPoints: 0,
      weakTopics: {},
      strongTopics: {},
      badges: [],
      weekendChallengeHistory: [],
      dailyActivity: {},
    }
  }
}

export function saveProgress(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function recordSolvedProblem(problem, session, score, passed) {
  const progress = getProgress()
  const today = new Date().toISOString().split('T')[0]
  // Don't save duplicate attempts of same problem
const alreadySolved = progress.solvedProblems.find(
  p => p.title === problem.title && p.passed === true
)
if (passed && alreadySolved) {
  saveProgress(progress)
  return points
}
  progress.solvedProblems.push({
    id: Date.now(),
    title: problem.title,
    language: session.language,
    topic: session.topic,
    difficulty: session.difficulty,
    score,
    passed,
    solvedAt: new Date().toISOString(),
  })

  const points = passed
    ? session.difficulty === 'Beginner' ? 10
    : session.difficulty === 'Intermediate' ? 25
    : 50
    : 5
  progress.totalPoints += points

  const lastDate = progress.lastSolvedDate
  if (lastDate === null) {
    progress.streak = 1
  } else {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    if (lastDate === yesterdayStr) {
      progress.streak += 1
    } else if (lastDate !== today) {
      progress.streak = 1
    }
  }
  progress.lastSolvedDate = today

  progress.dailyActivity[today] = (progress.dailyActivity[today] || 0) + 1

  if (!progress.weakTopics[session.topic]) {
    progress.weakTopics[session.topic] = { attempts: 0, passed: 0 }
  }
  progress.weakTopics[session.topic].attempts += 1
  if (passed) progress.weakTopics[session.topic].passed += 1

  progress.badges = awardBadges(progress)

  saveProgress(progress)
  return points
}

export function awardBadges(progress) {
  const badges = [...(progress.badges || [])]
  const badgeIds = badges.map(b => b.id)

  const checkAndAdd = (id, name, emoji, description) => {
    if (!badgeIds.includes(id)) {
      badges.push({ id, name, emoji, description, earnedAt: new Date().toISOString() })
    }
  }

  const solved = progress.solvedProblems || []
  const passed = solved.filter(p => p.passed)
  const uniquePassed = [...new Map(passed.map(p => [p.title, p])).values()]

  if (solved.length >= 1) checkAndAdd('first_blood', 'First Blood', '🩸', 'Solved your first problem!')
  if (uniquePassed.length >= 5) checkAndAdd('problem_solver', 'Problem Solver', '💪', 'Passed 5 unique problems!')
  if (uniquePassed.length >= 10) checkAndAdd('coding_ninja', 'Coding Ninja', '🥷', 'Passed 10 unique problems!')
  if (uniquePassed.length >= 25) checkAndAdd('legend', 'Legend', '🏆', 'Passed 25 unique problems!')
  if (progress.streak >= 3) checkAndAdd('on_fire', 'On Fire', '🔥', '3 day streak!')
  if (progress.streak >= 7) checkAndAdd('unstoppable', 'Unstoppable', '⚡', '7 day streak!')
  if (progress.totalPoints >= 100) checkAndAdd('century', 'Century', '💯', 'Earned 100 points!')
  if (passed.filter(p => p.score === 100).length >= 1) checkAndAdd('perfectionist', 'Perfectionist', '✨', 'Got a perfect 100/100 score!')
  const languages = [...new Set(solved.map(p => p.language))]
  if (languages.length >= 3) checkAndAdd('polyglot', 'Polyglot', '🌍', 'Solved in 3 different languages!')

  return badges
}

export function checkWeekendChallenge() {
  const today = new Date()
  const isSunday = today.getDay() === 0
  return isSunday
}