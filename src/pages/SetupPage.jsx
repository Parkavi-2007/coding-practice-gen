import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, BookOpen, Zap } from 'lucide-react'

const LANGUAGES = [
  'Python', 'JavaScript', 'Java', 'C++', 'TypeScript',
  'C', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby'
]

const TOPICS = {
  Python: ['Variables', 'Loops', 'Functions', 'Lists', 'Dictionaries', 'Tuples', 'Sets', 'OOP', 'Recursion', 'File Handling', 'Exception Handling', 'Modules', 'Comprehensions'],
  JavaScript: ['Variables', 'Loops', 'Functions', 'Arrays', 'Objects', 'DOM', 'Promises', 'Async/Await', 'Closures', 'ES6+', 'Error Handling', 'JSON', 'Fetch API'],
  Java: ['Variables', 'Loops', 'Functions', 'Arrays', 'OOP', 'Interfaces', 'Collections', 'Exception Handling', 'Generics', 'Threads', 'File I/O', 'Streams'],
  'C++': ['Variables', 'Loops', 'Functions', 'Arrays', 'Pointers', 'OOP', 'STL', 'Templates', 'Exception Handling', 'File I/O', 'Memory Management'],
  TypeScript: ['Variables', 'Loops', 'Functions', 'Arrays', 'Interfaces', 'Generics', 'OOP', 'Type Guards', 'Decorators', 'Modules', 'Async/Await'],
  C: ['Variables', 'Loops', 'Functions', 'Arrays', 'Pointers', 'Structs', 'Memory Management', 'File I/O', 'Recursion', 'Linked Lists'],
  'C#': ['Variables', 'Loops', 'Functions', 'Arrays', 'OOP', 'Interfaces', 'LINQ', 'Async/Await', 'Exception Handling', 'Generics', 'Delegates'],
  Go: ['Variables', 'Loops', 'Functions', 'Arrays', 'Slices', 'Maps', 'Structs', 'Goroutines', 'Channels', 'Interfaces', 'Error Handling'],
  Rust: ['Variables', 'Loops', 'Functions', 'Arrays', 'Ownership', 'Borrowing', 'Structs', 'Enums', 'Traits', 'Error Handling', 'Closures'],
  Kotlin: ['Variables', 'Loops', 'Functions', 'Arrays', 'OOP', 'Data Classes', 'Coroutines', 'Extensions', 'Null Safety', 'Collections'],
  Swift: ['Variables', 'Loops', 'Functions', 'Arrays', 'OOP', 'Optionals', 'Closures', 'Protocols', 'Error Handling', 'Generics'],
  PHP: ['Variables', 'Loops', 'Functions', 'Arrays', 'OOP', 'File Handling', 'MySQL', 'Sessions', 'Error Handling', 'JSON'],
  Ruby: ['Variables', 'Loops', 'Functions', 'Arrays', 'Hashes', 'OOP', 'Blocks', 'Modules', 'Exception Handling', 'File I/O'],
}

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced']

export default function SetupPage() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    // Load saved preferences from assessment
    const savedLanguage = localStorage.getItem('codegen_language')
    const savedLevel = localStorage.getItem('codegen_level')
    const savedFocus = localStorage.getItem('codegen_focus')
    const savedWeakTopics = localStorage.getItem('codegen_weak_topics')
    const savedSelectedTopic = localStorage.getItem('codegen_selected_topic')

    if (savedLanguage) {
      setLanguage(savedLanguage)
      setIsReturning(true)
    }

    if (savedLevel) {
      setDifficulty(savedLevel)
    }

    // Pre-fill topic based on focus choice
    if (savedFocus === 'weakness' && savedWeakTopics) {
      const weakTopics = JSON.parse(savedWeakTopics)
      if (weakTopics.length > 0) {
        // Find first weak topic that exists in current language topics
        const langTopics = TOPICS[savedLanguage] || []
        const matchedTopic = weakTopics.find(t => langTopics.includes(t))
        if (matchedTopic) setTopic(matchedTopic)
        else setTopic(weakTopics[0])
      }
    } else if (savedFocus === 'topic' && savedSelectedTopic) {
      setTopic(savedSelectedTopic)
    }
  }, [])

  const isReady = language && topic && difficulty

  function handleStart() {
    if (!isReady) return
    localStorage.setItem('codegen_session', JSON.stringify({ language, topic, difficulty }))
    navigate('/problems')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">
        {isReturning ? 'Welcome Back! 👋' : 'Start Practicing'}
      </h1>
      <p className="text-gray-400 mb-10">
        {isReturning
          ? 'Your preferences are pre-filled. Change anything or jump right in!'
          : 'Pick your language, topic and difficulty to get started.'}
      </p>

      {/* Step 1 - Language */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
          <Code2 size={16} className="text-purple-400" />
          Programming Language
        </label>
        <div className="flex flex-wrap gap-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setTopic('') }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                language === lang
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 - Topic */}
      {language && (
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <BookOpen size={16} className="text-purple-400" />
            Topic
            {isReturning && topic && (
              <span className="ml-2 text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                Recommended for you
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-3">
            {TOPICS[language]?.map(t => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  topic === t
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-purple-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 - Difficulty */}
      {language && (
        <div className="mb-10">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
            <Zap size={16} className="text-purple-400" />
            Difficulty
            {isReturning && difficulty && (
              <span className="ml-2 text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">
                Based on your level
              </span>
            )}
          </label>
          <div className="flex gap-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-6 py-2 rounded-lg text-sm font-medium border transition-all ${
                  difficulty === d
                    ? d === 'Beginner' ? 'bg-green-700 border-green-500 text-white'
                    : d === 'Intermediate' ? 'bg-yellow-700 border-yellow-500 text-white'
                    : 'bg-red-700 border-red-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleStart}
        disabled={!isReady}
        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
          isReady
            ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        {isReady ? '🚀 Generate Problems' : 'Complete all steps above'}
      </button>
    </div>
  )
}