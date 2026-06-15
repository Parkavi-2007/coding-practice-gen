import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, ChevronRight, Brain, Code2, Target, User, Zap, BookOpen, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../utils/supabase'

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'TypeScript', 'C', 'C#', 'Go', 'Rust', 'Kotlin']

const BACKGROUNDS = [
  { label: 'Student', emoji: '🎓', desc: 'Currently studying CS or related field' },
  { label: 'Self-taught', emoji: '📚', desc: 'Learning programming on my own' },
  { label: 'Professional', emoji: '💼', desc: 'Already working as a developer' },
  { label: 'Career Switcher', emoji: '🔄', desc: 'Switching to tech from another field' },
]

const GOALS = [
  { label: 'Learn Basics', emoji: '🌱', desc: 'I am new and want to learn fundamentals' },
  { label: 'Crack Interviews', emoji: '🎯', desc: 'Preparing for technical interviews' },
  { label: 'Improve Skills', emoji: '💪', desc: 'Already know basics, want to get better' },
  { label: 'Competitive Coding', emoji: '🏆', desc: 'Want to compete in coding contests' },
]

const ALL_TOPICS = ['Arrays', 'Strings', 'Loops', 'Functions', 'OOP', 'Recursion', 'Sorting', 'Searching', 'Linked Lists', 'Trees']

export default function AssessmentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState('language')
  const [language, setLanguage] = useState('')
  const [background, setBackground] = useState('')
  const [goal, setGoal] = useState('')
  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [level, setLevel] = useState(null)
  const [topicStats, setTopicStats] = useState({})
  const [focusMode, setFocusMode] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState('')

  async function handleGoalNext() {
    setStep('loading')
    setLoadingQuestions(true)
    try {
      const res = await fetch('/api/problems/assessment-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      })
      const data = await res.json()
      setQuestions(data)
      setStep('questions')
    } catch {
      setStep('questions')
    }
    setLoadingQuestions(false)
  }

  function handleNext() {
    const isCorrect = selected === questions[current].correct
    const q = questions[current]

    const newStats = { ...topicStats }
    if (!newStats[q.topic]) newStats[q.topic] = { correct: 0, total: 0 }
    newStats[q.topic].total += 1
    if (isCorrect) newStats[q.topic].correct += 1
    setTopicStats(newStats)

    const newAnswers = [...answers, { correct: isCorrect, topic: q.topic }]
    setAnswers(newAnswers)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      const score = newAnswers.filter(a => a.correct).length
      let assignedLevel = 'Beginner'
      if (score >= 8) assignedLevel = 'Advanced'
      else if (score >= 5) assignedLevel = 'Intermediate'

      if (goal === 'Learn Basics') assignedLevel = 'Beginner'
      if (goal === 'Competitive Coding') assignedLevel = 'Advanced'

      setLevel(assignedLevel)
      setStep('result')

      localStorage.setItem('codegen_assessed', 'true')
      localStorage.setItem('codegen_level', assignedLevel)
      localStorage.setItem('codegen_language', language)
      localStorage.setItem('codegen_background', background)
      localStorage.setItem('codegen_goal', goal)

      if (user) {
        supabase.from('profiles').update({
          level: assignedLevel,
          language,
          background,
          goal
        }).eq('id', user.id)
      }
    }
  }

  function getWeakTopics(stats) {
    return Object.entries(stats)
      .filter(([_, v]) => v.total > 0 && v.correct / v.total < 0.6)
      .map(([topic]) => topic)
  }

  function getStrongTopics(stats) {
    return Object.entries(stats)
      .filter(([_, v]) => v.total > 0 && v.correct / v.total >= 0.6)
      .map(([topic]) => topic)
  }

  function handleFocusChoice(choice) {
    setFocusMode(choice)
    if (choice === 'weakness') {
      const weak = getWeakTopics(topicStats)
      localStorage.setItem('codegen_focus', 'weakness')
      localStorage.setItem('codegen_weak_topics', JSON.stringify(weak))

      if (user) {
        supabase.from('profiles').update({
          focus_mode: 'weakness',
          weak_topics: weak
        }).eq('id', user.id)
      }

      navigate('/')
    }
  }

  function handleTopicSelect() {
    localStorage.setItem('codegen_focus', 'topic')
    localStorage.setItem('codegen_selected_topic', selectedTopic)

    if (user) {
      supabase.from('profiles').update({
        focus_mode: 'topic',
        selected_topic: selectedTopic
      }).eq('id', user.id)
    }

    navigate('/')
  }

  // Step: Language
  if (step === 'language') return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-8">
        <Code2 size={24} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold">Welcome to CodeGen! 👋</h1>
          <p className="text-gray-400">Let's personalize your experience. Pick your language.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        {LANGUAGES.map(lang => (
          <button key={lang} onClick={() => setLanguage(lang)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              language === lang ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
            }`}>{lang}</button>
        ))}
      </div>
      <button onClick={() => setStep('background')} disabled={!language}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          language ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}>
        Continue <ChevronRight size={18} />
      </button>
    </div>
  )

  // Step: Background
  if (step === 'background') return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-8">
        <User size={24} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold">Your Background</h1>
          <p className="text-gray-400">This helps us understand where you're coming from.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        {BACKGROUNDS.map(b => (
          <button key={b.label} onClick={() => setBackground(b.label)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              background === b.label ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
            }`}>
            <span className="text-3xl">{b.emoji}</span>
            <div>
              <p className="font-semibold">{b.label}</p>
              <p className="text-sm text-gray-400">{b.desc}</p>
            </div>
            {background === b.label && <CheckCircle size={18} className="ml-auto text-purple-400" />}
          </button>
        ))}
      </div>
      <button onClick={() => setStep('goal')} disabled={!background}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          background ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}>
        Continue <ChevronRight size={18} />
      </button>
    </div>
  )

  // Step: Goal
  if (step === 'goal') return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-center gap-3 mb-8">
        <Target size={24} className="text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold">Your Goal</h1>
          <p className="text-gray-400">What do you want to achieve with CodeGen?</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 mb-8">
        {GOALS.map(g => (
          <button key={g.label} onClick={() => setGoal(g.label)}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              goal === g.label ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
            }`}>
            <span className="text-3xl">{g.emoji}</span>
            <div>
              <p className="font-semibold">{g.label}</p>
              <p className="text-sm text-gray-400">{g.desc}</p>
            </div>
            {goal === g.label && <CheckCircle size={18} className="ml-auto text-purple-400" />}
          </button>
        ))}
      </div>
      <button onClick={handleGoalNext} disabled={!goal}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          goal ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}>
        Start Assessment <ChevronRight size={18} />
      </button>
    </div>
  )

  // Step: Loading questions
  if (step === 'loading') return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-gray-400">
      <Loader2 size={40} className="animate-spin text-purple-400" />
      <p className="text-xl font-semibold text-white">Preparing your assessment...</p>
      <p className="text-sm text-gray-500">Generating {language} questions just for you</p>
    </div>
  )

  // Step: Questions
  if (step === 'questions' && questions.length > 0) {
    const q = questions[current]
    return (
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8">
          <Brain size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-bold">Skill Assessment</h1>
            <p className="text-sm text-gray-400">Question {current + 1} of {questions.length}</p>
          </div>
          <div className="ml-auto flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${
                i < current ? 'bg-purple-500' : i === current ? 'bg-purple-400' : 'bg-gray-700'
              }`} />
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-purple-400 font-medium bg-purple-900/30 px-2 py-0.5 rounded-full">{q.topic}</span>
            <span className="text-xs text-gray-500 capitalize">{q.level} level</span>
          </div>
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {q.options.map((option, i) => {
            let style = 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
            if (selected !== null) {
              if (i === q.correct) style = 'bg-green-900/30 border-green-500 text-green-300'
              else if (i === selected && selected !== q.correct) style = 'bg-red-900/30 border-red-500 text-red-300'
              else style = 'bg-gray-900 border-gray-700 text-gray-500'
            }
            return (
              <button key={i} onClick={() => selected === null && setSelected(i)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${style}`}>
                <span className="w-7 h-7 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm">{option}</span>
                {selected !== null && i === q.correct && <CheckCircle size={16} className="ml-auto text-green-400" />}
                {selected !== null && i === selected && selected !== q.correct && <XCircle size={16} className="ml-auto text-red-400" />}
              </button>
            )
          })}
        </div>

        <button onClick={handleNext} disabled={selected === null}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            selected !== null ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}>
          {current + 1 === questions.length ? 'See Results' : 'Next Question'} <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  // Step: Result
  if (step === 'result') {
    const weak = getWeakTopics(topicStats)
    const strong = getStrongTopics(topicStats)
    const score = answers.filter(a => a.correct).length

    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">
            {level === 'Advanced' ? '🏆' : level === 'Intermediate' ? '💪' : '🌱'}
          </div>
          <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
          <p className="text-gray-400">You scored {score} out of {questions.length}</p>
          <div className={`inline-block mt-4 px-6 py-2 rounded-full font-bold text-lg ${
            level === 'Advanced' ? 'bg-purple-900/40 text-purple-400' :
            level === 'Intermediate' ? 'bg-yellow-900/40 text-yellow-400' :
            'bg-green-900/40 text-green-400'
          }`}>
            {level} Level
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4">
            <h3 className="font-semibold text-red-400 mb-3">⚠️ Needs Improvement</h3>
            {weak.length === 0
              ? <p className="text-gray-400 text-sm">No weak topics!</p>
              : weak.map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                  <XCircle size={14} className="text-red-400" /> {t}
                </div>
              ))
            }
          </div>
          <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4">
            <h3 className="font-semibold text-green-400 mb-3">✅ Strong Topics</h3>
            {strong.length === 0
              ? <p className="text-gray-400 text-sm">Keep practicing!</p>
              : strong.map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                  <CheckCircle size={14} className="text-green-400" /> {t}
                </div>
              ))
            }
          </div>
        </div>

        {!focusMode && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">How do you want to practice?</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleFocusChoice('weakness')}
                className="flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-xl transition-all text-center">
                <Zap size={32} className="text-yellow-400" />
                <p className="font-bold text-white">Fix My Weaknesses</p>
                <p className="text-xs text-gray-400">Platform focuses on topics you struggled with</p>
                {weak.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {weak.map(t => (
                      <span key={t} className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </button>
              <button onClick={() => setFocusMode('topic')}
                className="flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-xl transition-all text-center">
                <BookOpen size={32} className="text-blue-400" />
                <p className="font-bold text-white">Master a Topic</p>
                <p className="text-xs text-gray-400">Choose a specific topic you want to focus on</p>
              </button>
            </div>
          </div>
        )}

        {focusMode === 'topic' && (
          <div>
            <h2 className="text-xl font-bold text-center mb-6">Pick a topic to master</h2>
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {ALL_TOPICS.map(t => (
                <button key={t} onClick={() => setSelectedTopic(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedTopic === t
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={handleTopicSelect} disabled={!selectedTopic}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedTopic ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}>
              Start Practicing {selectedTopic} 🚀
            </button>
          </div>
        )}
      </div>
    )
  }
}