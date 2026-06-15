import { supabase } from './supabase'

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

export async function syncToSupabase(progress, userId) {
  if (!userId) return
  const { error } = await supabase.from('profiles').update({
    total_points: progress.totalPoints,
    streak: progress.streak,
    badges: progress.badges,
    solved_problems: progress.solvedProblems,
    daily_activity: progress.dailyActivity,
  }).eq('id', userId)
  if (error) console.error('Sync error:', error.message)
}

export function recordSolvedProblem(problem, session, score, passed) {
  const progress = getProgress()
  const today = new Date().toISOString().split('T')[0]

  const alreadySolved = progress.solvedProblems.find(
    p => p.title === problem.title && p.passed === true
  )
  if (passed && alreadySolved) {
    saveProgress(progress)
    return 0
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

  // Streak badges
  if (progress.streak >= 3) checkAndAdd('on_fire', 'On Fire', '🔥', '3 day streak!')
  if (progress.streak >= 7) checkAndAdd('unstoppable', 'Unstoppable', '⚡', '7 day streak!')

  // Points badges
  if (progress.totalPoints >= 100) checkAndAdd('century', 'Century', '💯', 'Earned 100 points!')
  if (progress.totalPoints >= 500) checkAndAdd('high_scorer', 'High Scorer', '🌟', 'Earned 500 points!')

  // Weekend challenge badges only
  const weekendSolved = (progress.weekendChallengeHistory || []).filter(w => w.passed)
  if (weekendSolved.length >= 1) checkAndAdd('weekend_warrior', 'Weekend Warrior', '⚔️', 'Solved your first weekend challenge!')
  if (weekendSolved.length >= 3) checkAndAdd('weekend_legend', 'Weekend Legend', '🏆', 'Solved 3 weekend challenges!')
  if (weekendSolved.length >= 5) checkAndAdd('champion', 'Champion', '👑', 'Solved 5 weekend challenges!')

  // Perfect score badge
  if (passed.filter(p => p.score === 100).length >= 1) checkAndAdd('perfectionist', 'Perfectionist', '✨', 'Got a perfect 100/100 score!')

  // Polyglot badge
  const languages = [...new Set(solved.map(p => p.language))]
  if (languages.length >= 3) checkAndAdd('polyglot', 'Polyglot', '🌍', 'Solved in 3 different languages!')

  return badges
}

export function checkWeekendChallenge() {
  const today = new Date()
  const isSunday = today.getDay() === 0
  return isSunday
}