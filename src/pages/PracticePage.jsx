import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { Lightbulb, Send, ArrowLeft, Loader2, CheckCircle, XCircle, Play } from 'lucide-react'
import { recordSolvedProblem, syncToSupabase, getProgress } from '../utils/storage'
import { useAuth } from '../context/AuthContext'

export default function PracticePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [hint, setHint] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning] = useState(false)
  const [hintLoading, setHintLoading] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [activeTab, setActiveTab] = useState('problem')
  const [storyMode, setStoryMode] = useState(false)
  const [story, setStory] = useState(null)
  const [storyLoading, setStoryLoading] = useState(false)
  const [whyWrong, setWhyWrong] = useState(null)
  const [whyWrongLoading, setWhyWrongLoading] = useState(false)
  const [teachExplanation, setTeachExplanation] = useState('')
const [teachResult, setTeachResult] = useState(null)
const [teachLoading, setTeachLoading] = useState(false)

  useEffect(() => {
    const savedSession = localStorage.getItem('codegen_session')
    const savedProblem = localStorage.getItem('codegen_problem')
    if (!savedSession || !savedProblem) { navigate('/'); return }
    const s = JSON.parse(savedSession)
    const p = JSON.parse(savedProblem)
    setSession(s)
    setProblem(p)
    setCode(p.starterCode || '')
    setLoading(false)
  }, [])

  async function handleHint() {
    setHintLoading(true)
    setHint('⏳ Generating hint...')
    try {
      const res = await fetch('/api/problems/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: session.language,
          topic: session.topic,
          difficulty: session.difficulty,
          problemTitle: problem.title,
          problemDescription: problem.description
        })
      })
      const data = await res.json()
      setHint(`💡 ${data.hint}`)
    } catch (err) {
      console.error('Hint error:', err)
      setHint('💡 Could not generate hint. Try again!')
    }
    setHintLoading(false)
  }

  async function handleRun() {
  console.log('Run clicked!', problem?.testCases)
  setRunning(true)
  setTestResults(null)
  setActiveTab('testcases')
  try {
    const res = await fetch('/api/problems/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: session.language,
        problemTitle: problem.title,
        problemDescription: problem.description,
        starterCode: problem.starterCode,
        userCode: code,
        testCases: problem.testCases
      })
    })
    const data = await res.json()
    console.log('Run result:', data)
    if (data.testResults && Array.isArray(data.testResults)) {
      setTestResults(data.testResults)
    } else if (Array.isArray(data)) {
      setTestResults(data)
    } else {
      setTestResults([])
    }
  } catch (err) {
    console.error('Run error:', err)
    setTestResults(null)
  }
  setRunning(false)
}

  async function handleSubmit() {
    setSubmitting(true)
    setFeedback(null)
    setWhyWrong(null)
    setActiveTab('feedback')
    try {
      const res = await fetch('/api/problems/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: session.language,
          problemTitle: problem.title,
          problemDescription: problem.description,
          starterCode: problem.starterCode,
          userCode: code,
          testCases: problem.testCases
        })
      })
      const data = await res.json()
      console.log('Submit result:', data)
      if (Array.isArray(data)) {
        const allPassed = data.every(t => t.passed)
        const score = Math.round((data.filter(t => t.passed).length / data.length) * 100)
        setFeedback({
          passed: allPassed,
          score,
          summary: allPassed ? 'All test cases passed!' : 'Some test cases failed.',
          correctness: 'Based on test case results.',
          improvements: 'Review failed test cases for improvements.',
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
        })
        setTestResults(data)
        recordSolvedProblem(problem, session, score, allPassed)
        syncToSupabase(getProgress(), user?.id)
      } else {
        setFeedback(data)
        setTestResults(data.testResults)
        recordSolvedProblem(problem, session, data.score || 0, data.passed || false)
        syncToSupabase(getProgress(), user?.id)
      }
    } catch (err) {
      console.error('Submit error:', err)
      setFeedback({ passed: false, summary: 'Could not evaluate code. Try again!' })
    }
    setSubmitting(false)
  }

  async function handleWhyWrong() {
    setWhyWrongLoading(true)
    setWhyWrong(null)
    try {
      const res = await fetch('/api/problems/why-wrong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: session.language,
          problemTitle: problem.title,
          problemDescription: problem.description,
          userCode: code,
          testResults: testResults || []
        })
      })
      const data = await res.json()
      setWhyWrong(data.explanation)
    } catch {
      setWhyWrong('Could not analyze. Try again!')
    }
    setWhyWrongLoading(false)
  }

  async function handleStoryMode() {
    if (!storyMode && !story) {
      setStoryLoading(true)
      try {
        const res = await fetch('/api/problems/story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemTitle: problem.title,
            problemDescription: problem.description,
            language: session.language
          })
        })
        const data = await res.json()
        setStory(data.story)
      } catch {
        setStory('Could not generate story. Try again!')
      }
      setStoryLoading(false)
    }
    setStoryMode(!storyMode)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-gray-400">
      <Loader2 size={24} className="animate-spin" />
      Loading problem...
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-semibold text-white">{problem?.title}</h2>
            <p className="text-xs text-gray-400">{session?.language} · {session?.topic} · {session?.difficulty}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleHint}
            disabled={hintLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-yellow-400 text-sm transition-all"
          >
            {hintLoading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
            Hint
          </button>
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm transition-all"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {running ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm transition-all"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel */}
        <div className="w-2/5 flex flex-col border-r border-gray-800 bg-gray-950">

          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {['problem', 'testcases', 'feedback'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Problem Tab */}
            {activeTab === 'problem' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-white">{problem?.title}</h3>
                  <button
                    onClick={handleStoryMode}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-all text-purple-400"
                  >
                    {storyLoading
                      ? <Loader2 size={14} className="animate-spin" />
                      : storyMode ? '📋' : '📖'
                    }
                    {storyLoading ? 'Loading...' : storyMode ? 'Normal Mode' : 'Story Mode'}
                  </button>
                </div>

                {storyMode && story ? (
                  <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-4 mb-6">
                    <p className="text-purple-200 text-sm leading-relaxed italic">{story}</p>
                    <div className="mt-4 pt-4 border-t border-purple-700/40">
                      <p className="text-xs text-purple-400 font-semibold mb-2">YOUR CHALLENGE:</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{problem?.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">{problem?.description}</p>
                )}

                <h4 className="font-semibold text-sm text-gray-400 mb-2">Examples</h4>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-green-400 mb-6 whitespace-pre-wrap">{problem?.examples}</pre>

                <h4 className="font-semibold text-sm text-gray-400 mb-2">Constraints</h4>
                <pre className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 whitespace-pre-wrap">{problem?.constraints}</pre>

                {hint && (
                  <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-300 text-sm">
                    {hint}
                  </div>
                )}
              </div>
            )}

            {/* Test Cases Tab */}
            {activeTab === 'testcases' && (
              <div>
                <h3 className="font-semibold text-lg mb-4 text-white">Test Cases</h3>
                {!testResults ? (
                  <div className="flex flex-col gap-3">
                    {problem?.testCases?.map((tc, i) => (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <p className="text-xs text-gray-400 mb-1">Case {i + 1}</p>
                        <p className="text-sm text-gray-300"><span className="text-gray-500">Input:</span> {tc.input}</p>
                        <p className="text-sm text-gray-300"><span className="text-gray-500">Expected:</span> {tc.expected}</p>
                        <p className="text-xs text-gray-500 mt-1">{tc.explanation}</p>
                      </div>
                    ))}
                    <p className="text-center text-gray-500 text-sm mt-4">Click Run to test your code</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {testResults.map((result, i) => (
                      <div key={i} className={`border rounded-lg p-4 ${
                        result.passed
                          ? 'bg-green-900/20 border-green-700/50'
                          : 'bg-red-900/20 border-red-700/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {result.passed
                            ? <CheckCircle size={16} className="text-green-400" />
                            : <XCircle size={16} className="text-red-400" />
                          }
                          <span className={`text-sm font-medium ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                            Case {i + 1} — {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">Input: <span className="text-gray-300">{result.input}</span></p>
                        <p className="text-xs text-gray-400">Expected: <span className="text-gray-300">{result.expected}</span></p>
                        <p className="text-xs text-gray-400">Got: <span className="text-gray-300">{result.actual}</span></p>
                        {result.explanation && (
                          <p className="text-xs text-gray-500 mt-1">{result.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div>
                <h3 className="font-semibold text-lg mb-4 text-white">Feedback</h3>
                {!feedback ? (
                  <p className="text-gray-500 text-sm text-center mt-8">Submit your code to get AI feedback</p>
                ) : (
                  <div className={`rounded-lg text-sm border p-4 ${
                    feedback.passed
                      ? 'bg-green-900/30 border-green-700/50 text-green-300'
                      : 'bg-red-900/30 border-red-700/50 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-3 font-semibold text-base">
                      {feedback.passed
                        ? <CheckCircle size={18} className="text-green-400" />
                        : <XCircle size={18} className="text-red-400" />
                      }
                      {feedback.passed ? 'Passed!' : 'Not Passed'}
                      {feedback.score !== undefined && (
                        <span className="ml-auto text-white bg-gray-800 px-2 py-0.5 rounded-lg text-sm">
                          Score: {feedback.score}/100
                        </span>
                      )}
                    </div>

                    <p className="mb-3 text-gray-300">{feedback.summary}</p>

                    {feedback.correctness && (
                      <div className="mb-3">
                        <p className="font-semibold text-white mb-1">Correctness</p>
                        <p className="text-gray-300">{feedback.correctness}</p>
                      </div>
                    )}

                    {feedback.improvements && (
                      <div className="mb-3">
                        <p className="font-semibold text-white mb-1">Improvements</p>
                        <p className="text-gray-300">{feedback.improvements}</p>
                      </div>
                    )}

                    {feedback.timeComplexity && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700">
                        <div>
                          <p className="text-xs text-gray-400">Time Complexity</p>
                          <p className="text-white font-mono text-sm">{feedback.timeComplexity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Space Complexity</p>
                          <p className="text-white font-mono text-sm">{feedback.spaceComplexity}</p>
                        </div>
                      </div>
                    )}

                    {/* Why Am I Wrong button */}
                    {!feedback.passed && (
                      <div className="mt-4">
                        <button
                          onClick={handleWhyWrong}
                          disabled={whyWrongLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-900/30 border border-orange-700/50 hover:bg-orange-900/50 rounded-lg text-orange-300 text-sm transition-all"
                        >
                          {whyWrongLoading
                            ? <Loader2 size={16} className="animate-spin" />
                            : '🤔'
                          }
                          {whyWrongLoading ? 'Analyzing your code...' : 'Why Am I Wrong?'}
                        </button>

                        {whyWrong && (
  <div className="mt-3 p-4 bg-orange-900/20 border border-orange-700/40 rounded-lg text-orange-200 text-sm leading-relaxed">
    {whyWrong.split('\n').map((line, i) => (
      <p key={i} className={`${line.startsWith('❌') ? 'font-semibold text-red-300 mt-3' : line.startsWith('→') ? 'ml-4 text-orange-200' : line.startsWith('💡') ? 'text-yellow-300 mt-3 font-semibold' : ''} ${line === '' ? 'hidden' : ''}`}>
        {line}
      </p>
    ))}
  </div>
)}
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            )}
          </div>
        </div>

        {/* Right — Editor */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
            {session?.language} Editor — write your solution below
          </div>
          <Editor
            height="100%"
            language={session?.language?.toLowerCase()}
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