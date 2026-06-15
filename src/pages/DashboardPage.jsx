import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Trophy, Code2, Target, TrendingUp, Clock, Star, User } from 'lucide-react'
import { getProgress } from '../utils/storage'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    setProgress(getProgress())
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  if (!progress) return (
    <div className="flex items-center justify-center h-96 text-gray-400">Loading...</div>
  )

  const solved = progress.solvedProblems || []
  const passed = solved.filter(p => p.passed)
  const avgScore = solved.length > 0
    ? Math.round(solved.reduce((a, b) => a + (b.score || 0), 0) / solved.length)
    : 0

  const topicMap = {}
  solved.forEach(p => {
    if (!topicMap[p.topic]) topicMap[p.topic] = { total: 0, passed: 0 }
    topicMap[p.topic].total += 1
    if (p.passed) topicMap[p.topic].passed += 1
  })

  const langMap = {}
  solved.forEach(p => { langMap[p.language] = (langMap[p.language] || 0) + 1 })

  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    last7Days.push({
      date: key,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      count: progress.dailyActivity?.[key] || 0
    })
  }
  const maxActivity = Math.max(...last7Days.map(d => d.count), 1)

  const levelColor = {
    'Beginner': 'text-green-400 bg-green-900/30 border-green-700/50',
    'Intermediate': 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50',
    'Advanced': 'text-purple-400 bg-purple-900/30 border-purple-700/50',
  }[profile?.level] || 'text-gray-400 bg-gray-800 border-gray-700'

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* Profile Card */}
      {profile && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-purple-700 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {profile.username ? profile.username[0].toUpperCase() : <User size={28} />}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{profile.username || 'Coder'}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${levelColor}`}>
                {profile.level || 'Beginner'}
              </span>
              {profile.language && (
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                  {profile.language}
                </span>
              )}
              {profile.goal && (
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                  🎯 {profile.goal}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all"
          >
            <Code2 size={16} />
            Practice Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={20} className="text-orange-400" />
            <span className="text-sm text-gray-400">Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">{progress.streak || 0}</p>
          <p className="text-xs text-gray-500 mt-1">days in a row</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={20} className="text-yellow-400" />
            <span className="text-sm text-gray-400">Total Points</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{progress.totalPoints || 0}</p>
          <p className="text-xs text-gray-500 mt-1">XP earned</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={20} className="text-green-400" />
            <span className="text-sm text-gray-400">Solved</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{passed.length}</p>
          <p className="text-xs text-gray-500 mt-1">problems passed</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={20} className="text-purple-400" />
            <span className="text-sm text-gray-400">Avg Score</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-1">out of 100</p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-purple-400" />
          Last 7 Days Activity
        </h2>
        <div className="flex items-end gap-3 h-24">
          {last7Days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-t-md transition-all ${day.count > 0 ? 'bg-purple-600' : 'bg-gray-800'}`}
                  style={{ height: `${(day.count / maxActivity) * 80}px`, minHeight: day.count > 0 ? '8px' : '4px' }}
                />
              </div>
              <span className="text-xs text-gray-500">{day.label}</span>
              {day.count > 0 && <span className="text-xs text-purple-400">{day.count}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Topic Breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-400" />
            Topic Breakdown
          </h2>
          {Object.keys(topicMap).length === 0 ? (
            <p className="text-gray-500 text-sm">No problems solved yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(topicMap).map(([topic, stats]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{topic}</span>
                    <span className="text-gray-500">{stats.passed}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            Badges
          </h2>
          {!progress.badges?.length ? (
            <p className="text-gray-500 text-sm">Solve problems to earn badges!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {progress.badges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center gap-1 p-3 bg-gray-800 rounded-xl border border-gray-700 w-20">
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-xs text-gray-300 text-center leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Problem History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-purple-400" />
          Problem History
        </h2>
        {solved.length === 0 ? (
          <p className="text-gray-500 text-sm">No problems solved yet. Start practicing!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...solved].reverse().map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{p.passed ? '✅' : '❌'}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.language} · {p.topic} · {p.difficulty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-400">{p.score}/100</p>
                  <p className="text-xs text-gray-500">{new Date(p.solvedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}