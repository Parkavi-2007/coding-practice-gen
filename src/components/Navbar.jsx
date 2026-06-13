import { Link, useLocation } from 'react-router-dom'
import { Code2, LayoutDashboard, Zap, Trophy } from 'lucide-react'

export default function Navbar() {
  const { pathname } = useLocation()

  const isSunday = new Date().getDay() === 0

  const links = [
    { to: '/', label: 'Setup', icon: <Zap size={16} /> },
    { to: '/practice', label: 'Practice', icon: <Code2 size={16} /> },
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  ]

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center gap-8">
      <span className="font-bold text-lg text-purple-400">CodeGen</span>
      <div className="flex gap-6">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-2 text-sm transition-colors ${
              pathname === link.to
                ? 'text-white font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}

        {/* Weekend Challenge — always visible for testing */}
        <Link
          to="/weekend-challenge"
          className={`flex items-center gap-2 text-sm transition-colors ${
            pathname === '/weekend-challenge'
              ? 'text-yellow-400 font-medium'
              : 'text-yellow-600 hover:text-yellow-400'
          }`}
        >
          <Trophy size={16} />
          {isSunday ? '🔥 Weekly Challenge' : 'Weekend Challenge'}
        </Link>
      </div>
    </nav>
  )
}