import type { Page } from '../App'

interface Props { page: Page; setPage: (p: Page) => void }

const navItems = [
  { name: 'dashboard',     label: 'Treningi',    icon: '⚡' },
  { name: 'new-session',   label: 'Nowy',        icon: '+' },
  { name: 'exercises',     label: 'Ćwiczenia',   icon: '◈' },
  { name: 'muscle-groups', label: 'Partie ciała',icon: '💪' },
  { name: 'stats',         label: 'Statystyki',  icon: '◎' },
] as const

export function Nav({ page, setPage }: Props) {
  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-logo">GL</span>
        <span className="nav-title">GymLog</span>
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.name}
            className={`nav-item ${page.name === item.name ? 'active' : ''}`}
            onClick={() => setPage({ name: item.name } as Page)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
