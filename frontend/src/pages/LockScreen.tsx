import { useState } from 'react'

interface Props { onAuth: (pw: string) => boolean }

export function LockScreen({ onAuth }: Props) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = () => {
    const ok = onAuth(pw)
    if (!ok) {
      setErr(true)
      setShake(true)
      setPw('')
      setTimeout(() => setShake(false), 600)
    }
  }

  return (
    <div className="lock-screen">
      <div className={`lock-card ${shake ? 'shake' : ''}`}>
        <div className="lock-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="lock-title">GymLog</h1>
        <p className="lock-sub">Twój dziennik treningowy</p>
        <input
          className={`lock-input ${err ? 'err' : ''}`}
          type="password"
          placeholder="Hasło"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
        />
        {err && <p className="lock-err">Nieprawidłowe hasło</p>}
        <button className="lock-btn" onClick={submit}>Wejdź</button>
      </div>
    </div>
  )
}
