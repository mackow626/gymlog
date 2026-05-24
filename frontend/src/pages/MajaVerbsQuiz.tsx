import { useEffect, useMemo, useRef, useState } from 'react'

const QUIZ_VERSION = 1
const BEST_SCORE_KEY = 'maja_verbs_best_score'

interface Verb {
  inf: string
  past: string
  pp: string
  pl: string
}

const VERBS: Verb[] = [
  { inf: 'be',         past: 'was / were', pp: 'been',        pl: 'być' },
  { inf: 'become',     past: 'became',     pp: 'become',      pl: 'stać się' },
  { inf: 'break',      past: 'broke',      pp: 'broken',      pl: 'złamać / zepsuć' },
  { inf: 'bring',      past: 'brought',    pp: 'brought',     pl: 'przynosić' },
  { inf: 'buy',        past: 'bought',     pp: 'bought',      pl: 'kupować' },
  { inf: 'choose',     past: 'chose',      pp: 'chosen',      pl: 'wybierać' },
  { inf: 'do',         past: 'did',        pp: 'done',        pl: 'robić' },
  { inf: 'drink',      past: 'drank',      pp: 'drunk',       pl: 'pić' },
  { inf: 'eat',        past: 'ate',        pp: 'eaten',       pl: 'jeść' },
  { inf: 'fall',       past: 'fell',       pp: 'fallen',      pl: 'upadać / padać' },
  { inf: 'find',       past: 'found',      pp: 'found',       pl: 'znajdować' },
  { inf: 'fly',        past: 'flew',       pp: 'flown',       pl: 'latać' },
  { inf: 'get',        past: 'got',        pp: 'got',         pl: 'dostać / dostawać' },
  { inf: 'give',       past: 'gave',       pp: 'given',       pl: 'dawać' },
  { inf: 'go',         past: 'went',       pp: 'gone',        pl: 'iść / jechać' },
  { inf: 'have',       past: 'had',        pp: 'had',         pl: 'mieć' },
  { inf: 'hold',       past: 'held',       pp: 'held',        pl: 'trzymać' },
  { inf: 'leave',      past: 'left',       pp: 'left',        pl: 'wychodzić / zostawiać' },
  { inf: 'lose',       past: 'lost',       pp: 'lost',        pl: 'gubić / przegrywać' },
  { inf: 'make',       past: 'made',       pp: 'made',        pl: 'robić / tworzyć' },
  { inf: 'meet',       past: 'met',        pp: 'met',         pl: 'spotykać' },
  { inf: 'read',       past: 'read',       pp: 'read',        pl: 'czytać' },
  { inf: 'run',        past: 'ran',        pp: 'run',         pl: 'biegać' },
  { inf: 'see',        past: 'saw',        pp: 'seen',        pl: 'widzieć' },
  { inf: 'sell',       past: 'sold',       pp: 'sold',        pl: 'sprzedawać' },
  { inf: 'sing',       past: 'sang',       pp: 'sung',        pl: 'śpiewać' },
  { inf: 'sit',        past: 'sat',        pp: 'sat',         pl: 'siedzieć' },
  { inf: 'sleep',      past: 'slept',      pp: 'slept',       pl: 'spać' },
  { inf: 'swim',       past: 'swam',       pp: 'swum',        pl: 'pływać' },
  { inf: 'take',       past: 'took',       pp: 'taken',       pl: 'brać / zabierać' },
  { inf: 'tell',       past: 'told',       pp: 'told',        pl: 'mówić / opowiadać' },
  { inf: 'think',      past: 'thought',    pp: 'thought',     pl: 'myśleć' },
  { inf: 'understand', past: 'understood', pp: 'understood',  pl: 'rozumieć' },
  { inf: 'wear',       past: 'wore',       pp: 'worn',        pl: 'nosić (ubranie)' },
  { inf: 'win',        past: 'won',        pp: 'won',         pl: 'wygrywać' },
  { inf: 'write',      past: 'wrote',      pp: 'written',     pl: 'pisać' },
]

type GivenField = 'inf' | 'past' | 'pp' | 'pl'

interface VerbTask {
  verb: Verb
  given: GivenField
}

type FieldResult = 'idle' | 'correct' | 'wrong'

interface FieldState {
  value: string
  result: FieldResult
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function checkAnswer(typed: string, correct: string): boolean {
  const norm = normalizeText(typed)
  const expected = normalizeText(correct)

  // exact match (with or without spaces around slash)
  if (norm === expected) return true
  if (norm.replace(/\s*\/\s*/g, '/') === expected.replace(/\s*\/\s*/g, '/')) return true

  // accept any single part when the correct answer contains slash-separated variants
  // e.g. "robić" is accepted when correct is "robić / tworzyć"
  const parts = correct.split('/').map((p) => normalizeText(p))
  if (parts.length > 1 && parts.some((p) => p === norm)) return true

  return false
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildTasks(): VerbTask[] {
  const givenFields: GivenField[] = ['inf', 'past', 'pp', 'pl']
  const shuffledVerbs = shuffle([...VERBS])

  return shuffledVerbs.map((verb) => ({
    verb,
    given: givenFields[Math.floor(Math.random() * givenFields.length)],
  }))
}

const FIELD_LABELS: Record<GivenField, string> = {
  inf: 'Bezokolicznik (infinitive)',
  past: 'Past Simple',
  pp: 'Past Participle',
  pl: 'Znaczenie (PL)',
}

const FIELD_PLACEHOLDERS: Record<GivenField, string> = {
  inf: 'np. go',
  past: 'np. went',
  pp: 'np. gone',
  pl: 'np. iść / jechać',
}

const ALL_FIELDS: GivenField[] = ['inf', 'past', 'pp', 'pl']

function makeEmptyFields(): Record<GivenField, FieldState> {
  return {
    inf:  { value: '', result: 'idle' },
    past: { value: '', result: 'idle' },
    pp:   { value: '', result: 'idle' },
    pl:   { value: '', result: 'idle' },
  }
}

export function MajaVerbsQuiz() {
  const [gameVersion, setGameVersion] = useState(0)
  const [tasks, setTasks] = useState<VerbTask[]>(() => buildTasks())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fields, setFields] = useState<Record<GivenField, FieldState>>(makeEmptyFields())
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [verbScores, setVerbScores] = useState<boolean[]>([])
  const [showTable, setShowTable] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const task = tasks[currentIndex]
  const missingFields = ALL_FIELDS.filter((f) => f !== task.given)

  const allFilled = missingFields.every((f) => fields[f].value.trim().length > 0)
  const allCorrectThisVerb =
    checked && missingFields.every((f) => fields[f].result === 'correct')

  useEffect(() => {
    setTasks(buildTasks())
    setCurrentIndex(0)
    setFields(makeEmptyFields())
    setChecked(false)
    setFinished(false)
    setVerbScores([])
  }, [gameVersion])

  useEffect(() => {
    setFields(makeEmptyFields())
    setChecked(false)
    // focus first input after navigation
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [currentIndex, gameVersion])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Maja | Czasowniki nieregularne'
    document.body.classList.add('maja-body')

    let meta = document.querySelector('meta[name="robots"]')
    const createdMeta = !meta

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }

    meta.setAttribute('content', 'noindex, nofollow')

    return () => {
      document.title = previousTitle
      document.body.classList.remove('maja-body')
      if (createdMeta && meta?.parentNode) {
        meta.parentNode.removeChild(meta)
      }
    }
  }, [])

  useEffect(() => {
    const savedBest = Number(localStorage.getItem(BEST_SCORE_KEY) || '0')
    setBestScore(Number.isFinite(savedBest) ? savedBest : 0)
  }, [])

  const score = useMemo(() => verbScores.filter(Boolean).length, [verbScores])

  useEffect(() => {
    if (!finished) return
    if (score <= bestScore) return
    setBestScore(score)
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  }, [finished, score, bestScore])

  const handleFieldChange = (field: GivenField, value: string) => {
    if (checked) return
    setFields((prev) => ({
      ...prev,
      [field]: { value, result: 'idle' },
    }))
  }

  const handleCheck = () => {
    if (!allFilled) return

    const updated = { ...fields }
    let allOk = true

    missingFields.forEach((f) => {
      const correct = checkAnswer(fields[f].value, task.verb[f])
      updated[f] = { ...updated[f], result: correct ? 'correct' : 'wrong' }
      if (!correct) allOk = false
    })

    setFields(updated)
    setChecked(true)
    setVerbScores((prev) => [...prev, allOk])
  }

  const handleNext = () => {
    if (currentIndex === tasks.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIndex((prev) => prev + 1)
  }

  const startAgain = () => {
    setGameVersion((prev) => prev + 1)
  }

  const percentage = Math.round((score / tasks.length) * 100)

  return (
    <div className="maja-shell">
      <div className="maja-glow maja-glow-a" />
      <div className="maja-glow maja-glow-b" />
      <p className="maja-version" aria-label="Wersja quizu">
        Wersja v{QUIZ_VERSION}
      </p>

      <main className="maja-wrap">
        <header className="maja-header">
          <p className="maja-kicker">Angielski | Czasowniki nieregularne</p>
          <h1 className="maja-title">Quiz dla Mai</h1>
          <p className="maja-sub">
            Ćwiczymy wszystkie {VERBS.length} czasowniki nieregularne. Dla każdego podana jest
            jedna forma — uzupełnij brakujące trzy. Każdy czasownik zostanie przerobiony!
          </p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja/historia">
              Quiz historia
            </a>
            <a className="maja-switch-link" href="/maja/angielski">
              Quiz angielski (sport)
            </a>
            <a className="maja-switch-link is-active" href="/maja/angielski/czasowniki">
              Czasowniki
            </a>
          </div>
          <p className="maja-meta">
            Najlepszy wynik: {bestScore}/{VERBS.length}
          </p>
          <button
            className="maja-btn maja-btn-ghost"
            style={{ marginTop: '0.5rem' }}
            onClick={() => setShowTable((prev) => !prev)}
          >
            {showTable ? 'Ukryj tabelę' : 'Pokaż tabelę czasowników'}
          </button>
        </header>

        {showTable && (
          <section className="maja-card" style={{ overflowX: 'auto' }}>
            <h2 className="maja-question" style={{ marginBottom: '1rem' }}>
              Wszystkie czasowniki
            </h2>
            <table className="maja-verbs-table">
              <thead>
                <tr>
                  <th>Bezokolicznik</th>
                  <th>Past Simple</th>
                  <th>Past Participle</th>
                  <th>Znaczenie</th>
                </tr>
              </thead>
              <tbody>
                {VERBS.map((verb) => (
                  <tr key={verb.inf}>
                    <td>
                      <strong>{verb.inf}</strong>
                    </td>
                    <td>{verb.past}</td>
                    <td>{verb.pp}</td>
                    <td>{verb.pl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!finished && (
          <section className="maja-card">
            {/* Progress */}
            <div className="maja-progress-head">
              <span>
                Czasownik {currentIndex + 1} / {tasks.length}
              </span>
              <span>
                Dobrze: {score} / {currentIndex}
              </span>
            </div>
            <div
              className="maja-progress"
              role="progressbar"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={tasks.length}
            >
              <div
                className="maja-progress-fill"
                style={{ width: `${((currentIndex + 1) / tasks.length) * 100}%` }}
              />
            </div>

            {/* Verb form card */}
            <div className="maja-verb-grid">
              {ALL_FIELDS.map((field, idx) => {
                const isGiven = field === task.given
                const fieldState = fields[field]
                const isFirstMissing =
                  !isGiven && missingFields.findIndex((f) => f === field) === 0

                let inputClass = 'maja-verb-input'
                if (checked && !isGiven) {
                  inputClass += fieldState.result === 'correct' ? ' is-correct' : ' is-wrong'
                }

                return (
                  <div key={field} className="maja-verb-field">
                    <label className="maja-verb-label">{FIELD_LABELS[field]}</label>
                    {isGiven ? (
                      <div className="maja-verb-given">{task.verb[field]}</div>
                    ) : (
                      <>
                        <input
                          ref={isFirstMissing ? firstInputRef : undefined}
                          className={inputClass}
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder={FIELD_PLACEHOLDERS[field]}
                          value={fieldState.value}
                          disabled={checked}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (!checked && allFilled) handleCheck()
                              else if (checked) handleNext()
                            }
                          }}
                        />
                        {checked && fieldState.result === 'wrong' && (
                          <p className="maja-verb-correction">
                            ✓ Poprawnie: <strong>{task.verb[field]}</strong>
                          </p>
                        )}
                      </>
                    )}
                    {/* progress dots row */}
                    {idx === ALL_FIELDS.length - 1 && (
                      <div
                        className="maja-verb-dots"
                        aria-hidden="true"
                        style={{ gridColumn: '1 / -1' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Feedback banner */}
            {checked && (
              <div className={`maja-feedback ${allCorrectThisVerb ? 'ok' : 'bad'}`}>
                <p className="maja-feedback-title">
                  {allCorrectThisVerb
                    ? '✓ Wszystkie trzy poprawnie! Świetna robota!'
                    : '✗ Nie wszystko się zgadza — sprawdź podpowiedzi powyżej.'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="maja-actions">
              {!checked ? (
                <button
                  className="maja-btn maja-btn-primary"
                  onClick={handleCheck}
                  disabled={!allFilled}
                >
                  Sprawdź
                </button>
              ) : (
                <button className="maja-btn maja-btn-primary" onClick={handleNext}>
                  {currentIndex === tasks.length - 1
                    ? 'Zakończ i podsumowanie'
                    : `Dalej →  (${currentIndex + 2}/${tasks.length})`}
                </button>
              )}
            </div>

            {/* Mini progress dots */}
            <div className="maja-dots-row" aria-hidden="true">
              {tasks.map((_, i) => {
                let cls = 'maja-dot'
                if (i < verbScores.length) {
                  cls += verbScores[i] ? ' done-ok' : ' done-bad'
                } else if (i === currentIndex) {
                  cls += ' active'
                }
                return <span key={i} className={cls} />
              })}
            </div>
          </section>
        )}

        {finished && (
          <section className="maja-card maja-summary">
            <h2 className="maja-result-title">Koniec!</h2>
            <p className="maja-result-score">
              Wynik: <strong>{score}/{tasks.length}</strong> ({percentage}%)
            </p>
            {score === tasks.length && (
              <p style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                🎉 Idealny wynik — wszystkie czasowniki opanowane!
              </p>
            )}
            {score >= tasks.length * 0.8 && score < tasks.length && (
              <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>👍 Prawie ideał!</p>
            )}

            {/* Show only wrong ones */}
            {verbScores.some((ok) => !ok) && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Błędne odpowiedzi — powtórz je:
                </h3>
                <table className="maja-verbs-table">
                  <thead>
                    <tr>
                      <th>Bezokolicznik</th>
                      <th>Past Simple</th>
                      <th>Past Participle</th>
                      <th>Znaczenie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter((_, i) => !verbScores[i])
                      .map(({ verb }) => (
                        <tr key={verb.inf}>
                          <td>
                            <strong>{verb.inf}</strong>
                          </td>
                          <td>{verb.past}</td>
                          <td>{verb.pp}</td>
                          <td>{verb.pl}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="maja-actions" style={{ marginTop: '1.5rem' }}>
              <button className="maja-btn maja-btn-primary" onClick={startAgain}>
                Zagraj jeszcze raz
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
