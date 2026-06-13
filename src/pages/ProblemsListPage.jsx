import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ChevronRight, Code2 } from 'lucide-react'

export default function ProblemsListPage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('codegen_session')
    if (!saved) { navigate('/'); return }
    const s = JSON.parse(saved)
    setSession(s)

    fetch('/api/problems/generate-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: s.language, topic: s.topic, difficulty: s.difficulty })
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProblems(data)
        } else {
          setProblems([])
          console.error('Invalid data:', data)
        }
        setLoading(false)
      })
      .catch(() => {
        setProblems([])
        setLoading(false)
      })
  }, [])

  function handleSelectProblem(problem) {
    localStorage.setItem('codegen_problem', JSON.stringify(problem))
    navigate('/practice')
  }

  function getDifficultyColor(difficulty) {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-400'
      case 'intermediate': return 'text-yellow-400'
      case 'advanced': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-3 text-gray-400">
      <Loader2 size={32} className="animate-spin text-purple-400" />
      <p className="text-lg">Generating problems for you...</p>
      <p className="text-sm text-gray-500">This may take a few seconds</p>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Problem List</h1>
          <p className="text-sm text-gray-400">
            {session?.language} · {session?.topic} · {session?.difficulty}
          </p>
        </div>
      </div>

      {/* Problems List */}
      <div className="flex flex-col gap-3">
        {problems.map((problem, index) => (
          <button
            key={problem.id}
            onClick={() => handleSelectProblem(problem)}
            className="flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-500 hover:bg-gray-800 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              {/* Number */}
              <span className="text-gray-500 text-sm font-mono w-6">{index + 1}.</span>

              {/* Icon */}
              <div className="p-2 bg-gray-800 group-hover:bg-purple-900/40 rounded-lg transition-colors">
                <Code2 size={16} className="text-purple-400" />
              </div>

              {/* Title and difficulty */}
              <div>
                <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {problem.title}
                </h3>
                <p className={`text-xs font-medium mt-0.5 ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </p>
              </div>
            </div>

            <ChevronRight size={18} className="text-gray-600 group-hover:text-purple-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}