import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { ArrowLeft, Loader2, Trophy, Clock, CheckCircle, XCircle, Send, Play } from 'lucide-react'
import { getProgress, saveProgress } from '../utils/storage'

export default function WeekendChallengePage() {
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [badgeEarned, setBadgeEarned] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('codegen_language') || 'Python')
const [started, setStarted] = useState(false)

  useEffect(() => {
    const language = localStorage.getItem('codegen_language') || 'Python'
    const level = localStorage.getItem('codegen_level') || 'Intermediate'

    const cached = localStorage.getItem('codegen_weekend_challenge')
    if (cached) {
      const parsed = JSON.parse(cached)
      setChallenge(parsed)
      setCode(parsed.starterCode || '')
      setLoading(false)
      setTimerActive(true)
      return
    }

    fetch('/api/problems/weekend-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, level })
    })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('codegen_weekend_challenge', JSON.stringify(data))
        setChallenge(data)
        setCode(data.starterCode || '')
        setLoading(false)
        setTimerActive(true)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timerActive])

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  async function handleRun() {
    setRunning(true)
    setTestResults(null)
    try {
      const res = await fetch('/api/problems/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: localStorage.getItem('codegen_language') || 'Python',
          problemTitle: challenge.title,
          problemDescription: challenge.description,
          starterCode: challenge.starterCode,
          userCode: code,
          testCases: challenge.testCases
        })
      })
      const data = await res.json()
      if (data.testResults && Array.isArray(data.testResults)) {
        setTestResults(data.testResults)
      } else if (Array.isArray(data)) {
        setTestResults(data)
      }
    } catch (err) {
      console.error(err)
    }
    setRunning(false)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setTimerActive(false)
    try {
      const res = await fetch('/api/problems/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: localStorage.getItem('codegen_language') || 'Python',
          problemTitle: challenge.title,
          problemDescription: challenge.description,
          starterCode: challenge.starterCode,
          userCode: code,
          testCases: challenge.testCases
        })
      })
      const data = await res.json()

      let finalResult
      if (Array.isArray(data)) {
        const allPassed = data.every(t => t.passed)
        finalResult = {
          passed: allPassed,
          score: Math.round((data.filter(t => t.passed).length / data.length) * 100),
          testResults: data
        }
      } else {
        finalResult = data
      }

      setResult(finalResult)
      setSubmitted(true)

      const progress = getProgress()

      // Record weekend challenge history
      progress.weekendChallengeHistory = progress.weekendChallengeHistory || []
      progress.weekendChallengeHistory.push({
        title: challenge.title,
        passed: finalResult.passed,
        score: finalResult.score,
        solvedAt: new Date().toISOString()
      })

      // Award badges based on weekend history
      if (finalResult.passed) {
        const weekendSolved = progress.weekendChallengeHistory.filter(w => w.passed)
        
        const checkAndAdd = (id, name, emoji, description) => {
          if (!progress.badges.find(b => b.id === id)) {
            progress.badges.push({ id, name, emoji, description, earnedAt: new Date().toISOString() })
            setBadgeEarned(true)
          }
        }

        if (weekendSolved.length >= 1) checkAndAdd('weekend_warrior', 'Weekend Warrior', '⚔️', 'Solved your first weekend challenge!')
        if (weekendSolved.length >= 3) checkAndAdd('weekend_legend', 'Weekend Legend', '🏆', 'Solved 3 weekend challenges!')
        if (weekendSolved.length >= 5) checkAndAdd('champion', 'Champion', '👑', 'Solved 5 weekend challenges!')
      }

      saveProgress(progress)
    } catch (err) {
      console.error(err)
    }
    setSubmitting(false)
  }
  if (!started) return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="text-6xl mb-6">⚔️</div>
      <h1 className="text-3xl font-bold text-yellow-400 mb-2">Weekend Challenge</h1>
      <p className="text-gray-400 mb-8">A special hard problem. 30 minutes. Can you solve it?</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-left">
        <label className="text-sm font-semibold text-gray-300 mb-3 block">Select Language</label>
        <div className="flex flex-wrap gap-3">
          {['Python', 'JavaScript', 'Java', 'C++', 'TypeScript', 'C', 'C#', 'Go', 'Rust', 'Kotlin'].map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedLanguage === lang
                  ? 'bg-yellow-600 border-yellow-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-yellow-500'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.setItem('codegen_language', selectedLanguage)
          localStorage.removeItem('codegen_weekend_challenge')
          setStarted(true)
          setLoading(true)
          const level = localStorage.getItem('codegen_level') || 'Intermediate'
          fetch('/api/problems/weekend-challenge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: selectedLanguage, level })
          })
            .then(res => res.json())
            .then(data => {
              localStorage.setItem('codegen_weekend_challenge', JSON.stringify(data))
              setChallenge(data)
              setCode(data.starterCode || '')
              setLoading(false)
              setTimerActive(true)
            })
            .catch(() => setLoading(false))
        }}
        className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold text-lg transition-all"
      >
        Start Challenge ⚔️
      </button>
    </div>
  )
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Loader2 size={32} className="animate-spin text-yellow-400" />
      <p className="text-lg text-gray-400">Preparing your weekend challenge...</p>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-yellow-800/50 bg-yellow-900/10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-yellow-400 flex items-center gap-2">
              <Trophy size={18} /> Weekend Challenge
            </h2>
            <p className="text-xs text-gray-400">{challenge?.title}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${
          timeLeft < 300 ? 'bg-red-900/40 text-red-400' :
          timeLeft < 600 ? 'bg-yellow-900/40 text-yellow-400' :
          'bg-gray-800 text-green-400'
        }`}>
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRun}
            disabled={running || submitted}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium transition-all"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {running ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-all"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Submitting...' : submitted ? 'Submitted!' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Badge earned popup */}
      {badgeEarned && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-8 text-center max-w-sm mx-4">
            <div className="text-7xl mb-4">{challenge?.badge?.emoji || '⚔️'}</div>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Badge Earned!</h2>
            <p className="text-white font-semibold text-lg mb-1">{challenge?.badge?.name || 'Weekend Warrior'}</p>
            <p className="text-gray-400 text-sm mb-6">{challenge?.badge?.description}</p>
            <button
              onClick={() => { setBadgeEarned(false); navigate('/dashboard') }}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-semibold transition-all"
            >
              View in Dashboard 🏆
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — Problem */}
        <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-800 bg-gray-950">
          {!submitted ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 bg-red-900/40 text-red-400 text-xs font-bold rounded-full">HARD</span>
                <span className="text-xs text-gray-500">Special Weekly Challenge</span>
              </div>
              <h3 className="font-bold text-xl mb-4 text-white">{challenge?.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">{challenge?.description}</p>

              <h4 className="font-semibold text-sm text-gray-400 mb-2">Examples</h4>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-green-400 mb-6 whitespace-pre-wrap">{challenge?.examples}</pre>

              <h4 className="font-semibold text-sm text-gray-400 mb-2">Constraints</h4>
              <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{challenge?.constraints}</pre>

              {/* Test results from Run */}
              {testResults && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm text-gray-400 mb-2">Run Results</h4>
                  <div className="flex flex-col gap-2">
                    {testResults.map((tc, i) => (
                      <div key={i} className={`border rounded-lg p-3 ${
                        tc.passed ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {tc.passed
                            ? <CheckCircle size={14} className="text-green-400" />
                            : <XCircle size={14} className="text-red-400" />
                          }
                          <span className={`text-xs font-medium ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                            Case {i + 1} — {tc.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Input: <span className="text-gray-300">{tc.input}</span></p>
                        <p className="text-xs text-gray-400">Expected: <span className="text-gray-300">{tc.expected}</span></p>
                        <p className="text-xs text-gray-400">Got: <span className="text-gray-300">{tc.actual}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-xl mb-6 text-white">Results</h3>
              <div className={`p-4 rounded-xl border mb-6 ${
                result?.passed
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-red-900/30 border-red-700/50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result?.passed
                    ? <CheckCircle size={20} className="text-green-400" />
                    : <XCircle size={20} className="text-red-400" />
                  }
                  <span className="font-bold text-lg text-white">
                    {result?.passed ? 'Challenge Completed! 🎉' : 'Keep Trying!'}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">Score: {result?.score}/100</p>
              </div>

              <div className="flex flex-col gap-3">
                {result?.testResults?.map((tc, i) => (
                  <div key={i} className={`border rounded-lg p-3 ${
                    tc.passed ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {tc.passed
                        ? <CheckCircle size={14} className="text-green-400" />
                        : <XCircle size={14} className="text-red-400" />
                      }
                      <span className={`text-xs font-medium ${tc.passed ? 'text-green-400' : 'text-red-400'}`}>
                        Case {i + 1} — {tc.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Input: <span className="text-gray-300">{tc.input}</span></p>
                    <p className="text-xs text-gray-400">Expected: <span className="text-gray-300">{tc.expected}</span></p>
                    <p className="text-xs text-gray-400">Got: <span className="text-gray-300">{tc.actual}</span></p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold transition-all"
              >
                View Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Right — Editor */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
            {localStorage.getItem('codegen_language')} Editor — write your solution below
          </div>
          <Editor
            height="100%"
            language={(localStorage.getItem('codegen_language') || 'python').toLowerCase()}
            value={code}
            onChange={(val) => setCode(val)}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
    </div>
  )
}