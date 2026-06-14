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
      <div className="flex items-center gap-2">
  <svg width="40" height="40" viewBox="0 0 40 40">
    <polygon 
      points="20,2 36,11 36,29 20,38 4,29 4,11" 
      fill="#3b0764"
      stroke="#7c3aed"
      strokeWidth="1.5"
    />
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="Arial">
      C<tspan fill="#facc15">⚡</tspan>G
    </text>
  </svg>
  <span className="font-bold text-xl text-white">Code<span className="text-purple-400">Gen</span></span>
</div>
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