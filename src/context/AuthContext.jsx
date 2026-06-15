import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUser(session?.user ?? null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleUser(currentUser) {
    setUser(currentUser)

    if (currentUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profile) {
        if (profile.level) localStorage.setItem('codegen_level', profile.level)
        if (profile.language) localStorage.setItem('codegen_language', profile.language)
        if (profile.background) localStorage.setItem('codegen_background', profile.background)
        if (profile.goal) localStorage.setItem('codegen_goal', profile.goal)
        if (profile.focus_mode) localStorage.setItem('codegen_focus', profile.focus_mode)
        if (profile.weak_topics) localStorage.setItem('codegen_weak_topics', JSON.stringify(profile.weak_topics))
        if (profile.selected_topic) localStorage.setItem('codegen_selected_topic', profile.selected_topic)
        if (profile.language) localStorage.setItem('codegen_assessed', 'true')

        // Load progress from Supabase into localStorage
        const merged = {
          solvedProblems: profile.solved_problems || [],
          streak: profile.streak || 0,
          totalPoints: profile.total_points || 0,
          badges: profile.badges || [],
          dailyActivity: profile.daily_activity || {},
          lastSolvedDate: null,
          weakTopics: {},
          strongTopics: {},
          weekendChallengeHistory: [],
        }
        localStorage.setItem('codegen_progress', JSON.stringify(merged))
      }
    } else {
      localStorage.removeItem('codegen_assessed')
      localStorage.removeItem('codegen_level')
      localStorage.removeItem('codegen_language')
      localStorage.removeItem('codegen_background')
      localStorage.removeItem('codegen_goal')
      localStorage.removeItem('codegen_focus')
      localStorage.removeItem('codegen_weak_topics')
      localStorage.removeItem('codegen_selected_topic')
    }

    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}