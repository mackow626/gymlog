import { useEffect, useMemo, useRef, useState } from 'react'

const QUIZ_VERSION = 1
const BEST_SCORE_KEY = 'maja_holidays_best_score'

interface Word {
  en: string
  pl: string
  altEn?: string[]   // extra accepted spellings when typing the English
  altPl?: string[]   // extra accepted spellings when typing the Polish
}

const WORDS: Word[] = [
  { en: 'apartment',              pl: 'apartament' },
  { en: 'cottage',                pl: 'chatka',                   altPl: ['chata', 'domek'] },
  { en: 'youth hostel',           pl: 'schronisko młodzieżowe',   altPl: ['hotel dla młodzieży'] },
  { en: 'tent',                   pl: 'namiot' },
  { en: 'caravan',                pl: 'przyczepa kempingowa',     altPl: ['wóz kempingowy', 'przyczepa'] },
  {
    en: 'B&B (bed and breakfast)',
    pl: 'pensjonat ze śniadaniem',
    altEn: ['b&b', 'bb', 'bed and breakfast'],
    altPl: ['pensjonat', 'pensjonat oferujący zakwaterowanie ze śniadaniem'],
  },
  { en: 'chalet',                 pl: 'domek w górach',           altPl: ['domek'] },
  { en: 'accommodation',          pl: 'zakwaterowanie' },
  { en: 'skiing holiday',         pl: 'wyjazd na narty',          altEn: ['skiing holidays'] },
  { en: 'destination',            pl: 'cel podróży' },
  { en: 'length of holiday trip', pl: 'długość wycieczki',        altEn: ['length of the holiday trip'] },
  { en: 'outdoor activity',       pl: 'aktywność na dworze',      altPl: ['aktywność na świeżym powietrzu', 'aktywność na zewnątrz'] },
  { en: 'stay in',                pl: 'pozostawać w domu',        altPl: ['zostawać w domu', 'siedzieć w domu'] },
  { en: 'summer camp',            pl: 'obóz letni' },
  { en: 'school trip',            pl: 'wycieczka szkolna' },
  { en: 'go canoeing',            pl: 'pływać kajakiem',          altEn: ['canoeing'], altPl: ['iść na kajaki', 'jeździć na kajaki'] },
  { en: 'identify plants',        pl: 'rozpoznawać rośliny' },
  { en: 'pick fruit',             pl: 'zbierać owoce',            altEn: ['pick fruits'] },
  { en: 'collect wood',           pl: 'zbierać drewno' },
  { en: 'light a fire',           pl: 'rozpalić ogień',           altEn: ['light fire'], altPl: ['rozpalać ogień'] },
  { en: 'use a compass',          pl: 'używać kompasu',           altEn: ['use compass'] },
]

type Direction = 'pl-en' | 'en-pl' | 'mixed'
type AnswerMode = 'choice' | 'typing'

interface Task {
  word: Word
  askPl: boolean // true → show Polish, answer in English
  choices: string[]
  correctIndex: number
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Lenient compare: ignores case, Polish diacritics, punctuation,
 *  leading articles and any parenthesised part. */
function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')          // drop "(bed and breakfast)"
    .replace(/[ąàâ]/g, 'a')
    .replace(/[ćç]/g, 'c')
    .replace(/[ęèé]/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/[óô]/g, 'o')
    .replace(/ś/g, 's')
    .replace(/[źż]/g, 'z')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')      // punctuation → space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(a|an|the)\s+/, '')     // ignore leading article
}

function acceptedFor(word: Word, askPl: boolean): string[] {
  return askPl
    ? [word.en, ...(word.altEn || [])]
    : [word.pl, ...(word.altPl || [])]
}

function isTypedCorrect(typed: string, word: Word, askPl: boolean): boolean {
  const n = normalizeAnswer(typed)
  if (!n) return false
  return acceptedFor(word, askPl).some((a) => normalizeAnswer(a) === n)
}

function buildTasks(direction: Direction): Task[] {
  return shuffle([...WORDS]).map((word) => {
    const askPl =
      direction === 'pl-en' ? true
      : direction === 'en-pl' ? false
      : Math.random() < 0.5

    const correct = askPl ? word.en : word.pl
    const pool = WORDS
      .filter((w) => w.en !== word.en)
      .map((w) => (askPl ? w.en : w.pl))

    const choices = shuffle([correct, ...shuffle(pool).slice(0, 3)])

    return { word, askPl, choices, correctIndex: choices.indexOf(correct) }
  })
}

export function MajaHolidaysQuiz() {
  const [direction, setDirection] = useState<Direction>('mixed')
  const [gameVersion, setGameVersion] = useState(0)
  const [tasks, setTasks] = useState<Task[]>(() => buildTasks('mixed'))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [typedChecked, setTypedChecked] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [bestScore, setBestScore] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const task = tasks[currentIndex]
  // English answers are typed; Polish answers are picked from options.
  const isTyping = task.askPl
  const checked = isTyping ? typedChecked : selected !== null
  const isCorrect = isTyping
    ? typedChecked && isTypedCorrect(typed, task.word, task.askPl)
    : selected === task.correctIndex

  useEffect(() => {
    setTasks(buildTasks(direction))
    setCurrentIndex(0)
    setSelected(null)
    setTyped('')
    setTypedChecked(false)
    setResults([])
    setFinished(false)
  }, [direction, gameVersion])

  // focus the input whenever a typing question comes up
  useEffect(() => {
    if (isTyping && !typedChecked) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [currentIndex, isTyping, typedChecked])

  useEffect(() => {
    const prev = document.title
    document.title = 'Maja | Holidays – słówka'
    document.body.classList.add('maja-body')
    let meta = document.querySelector('meta[name="robots"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', 'noindex, nofollow')
    return () => {
      document.title = prev
      document.body.classList.remove('maja-body')
      if (created && meta?.parentNode) meta.parentNode.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_SCORE_KEY) || '0')
    setBestScore(Number.isFinite(saved) ? saved : 0)
  }, [])

  const score = useMemo(() => results.filter(Boolean).length, [results])

  useEffect(() => {
    if (!finished || score <= bestScore) return
    setBestScore(score)
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  }, [finished, score, bestScore])

  const handleSelect = (index: number) => {
    if (checked) return
    setSelected(index)
    setResults((prev) => [...prev, index === task.correctIndex])
  }

  const handleCheckTyped = () => {
    if (typedChecked || !typed.trim()) return
    setTypedChecked(true)
    setResults((prev) => [...prev, isTypedCorrect(typed, task.word, task.askPl)])
  }

  const handleNext = () => {
    if (currentIndex === tasks.length - 1) {
      setFinished(true)
      return
    }
    setCurrentIndex((prev) => prev + 1)
    setSelected(null)
    setTyped('')
    setTypedChecked(false)
  }

  const percentage = Math.round((score / tasks.length) * 100)

  return (
    <div className="maja-shell">
      <div className="maja-glow maja-glow-a" />
      <div className="maja-glow maja-glow-b" />
      <p className="maja-version">Wersja v{QUIZ_VERSION}</p>

      <main className="maja-wrap">
        <header className="maja-header">
          <p className="maja-kicker">Angielski · Holidays</p>
          <h1 className="maja-title">Słówka — wakacje</h1>
          <p className="maja-sub">
            Wszystkie {WORDS.length} słówek z listy. Angielskie słówka wpisujesz z klawiatury,
            polskie wybierasz z opcji. Ogonki i „a/the" nie są wymagane.
          </p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja">Hub</a>
            <a className="maja-switch-link" href="/maja/angielski/czasowniki">Czasowniki</a>
            <a className="maja-switch-link is-active" href="/maja/angielski/holidays">Holidays</a>
          </div>
          <p className="maja-meta">Najlepszy wynik: {bestScore}/{WORDS.length}</p>

          {/* Direction picker */}
          <div className="mhol-modes">
            {([
              { key: 'pl-en',  label: 'Polski → Angielski' },
              { key: 'en-pl',  label: 'Angielski → Polski' },
              { key: 'mixed',  label: 'Mieszane' },
            ] as const).map((m) => (
              <button
                key={m.key}
                className={`mhol-mode${direction === m.key ? ' is-active' : ''}`}
                onClick={() => setDirection(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            className="maja-btn maja-btn-ghost"
            style={{ marginTop: '0.6rem' }}
            onClick={() => setShowTable((p) => !p)}
          >
            {showTable ? 'Ukryj listę słówek' : 'Pokaż listę słówek'}
          </button>
        </header>

        {showTable && (
          <section className="maja-card" style={{ overflowX: 'auto' }}>
            <table className="maja-verbs-table">
              <thead>
                <tr><th>Angielski</th><th>Polski</th></tr>
              </thead>
              <tbody>
                {WORDS.map((w) => (
                  <tr key={w.en}>
                    <td><strong>{w.en}</strong></td>
                    <td>{w.pl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!finished && (
          <section className="maja-card">
            <div className="maja-progress-head">
              <span>Słówko {currentIndex + 1} / {tasks.length}</span>
              <span>Dobrze: {score} / {currentIndex}</span>
            </div>
            <div className="maja-progress">
              <div
                className="maja-progress-fill"
                style={{ width: `${((currentIndex + 1) / tasks.length) * 100}%` }}
              />
            </div>

            <p className="mhol-direction-tag">
              {isTyping ? 'Wpisz po angielsku' : 'Wybierz polskie znaczenie'}
            </p>

            <h2 className="mhol-prompt">
              {task.askPl ? task.word.pl : task.word.en}
            </h2>

            {isTyping ? (
              <div className="mhol-typing">
                <input
                  ref={inputRef}
                  className={`maja-verb-input${
                    typedChecked ? (isCorrect ? ' is-correct' : ' is-wrong') : ''
                  }`}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="np. summer camp"
                  value={typed}
                  disabled={typedChecked}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    if (!typedChecked) handleCheckTyped()
                    else handleNext()
                  }}
                />
                {!typedChecked && (
                  <button
                    className="maja-btn maja-btn-ghost"
                    onClick={handleCheckTyped}
                    disabled={!typed.trim()}
                  >
                    Sprawdź
                  </button>
                )}
              </div>
            ) : (
              <div className="maja-answers">
                {task.choices.map((choice, index) => {
                  let cls = 'maja-answer'
                  if (checked) {
                    if (index === task.correctIndex) cls += ' is-correct'
                    else if (index === selected) cls += ' is-wrong'
                  } else if (index === selected) cls += ' is-selected'

                  return (
                    <button
                      key={choice}
                      className={cls}
                      onClick={() => handleSelect(index)}
                      disabled={checked}
                    >
                      <span className="maja-badge">{String.fromCharCode(65 + index)}</span>
                      <span>{choice}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {checked && (
              <div className={`maja-feedback ${isCorrect ? 'ok' : 'bad'}`}>
                <p className="maja-feedback-title">
                  {isCorrect ? '✓ Dobrze!' : '✗ Niestety nie.'}
                </p>
                <p>
                  <strong>{task.word.en}</strong> = {task.word.pl}
                </p>
              </div>
            )}

            <div className="maja-actions">
              <button
                className="maja-btn maja-btn-primary"
                onClick={handleNext}
                disabled={!checked}
              >
                {currentIndex === tasks.length - 1 ? 'Zakończ' : 'Dalej →'}
              </button>
            </div>

            <div className="maja-dots-row">
              {tasks.map((_, i) => {
                let cls = 'maja-dot'
                if (i < results.length) cls += results[i] ? ' done-ok' : ' done-bad'
                else if (i === currentIndex) cls += ' active'
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
                🎉 Wszystkie słówka poprawnie!
              </p>
            )}

            {results.some((ok) => !ok) && (
              <>
                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Do powtórki:
                </h3>
                <table className="maja-verbs-table">
                  <thead>
                    <tr><th>Angielski</th><th>Polski</th></tr>
                  </thead>
                  <tbody>
                    {tasks.filter((_, i) => !results[i]).map(({ word }) => (
                      <tr key={word.en}>
                        <td><strong>{word.en}</strong></td>
                        <td>{word.pl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="maja-actions" style={{ marginTop: '1.5rem' }}>
              <button
                className="maja-btn maja-btn-primary"
                onClick={() => setGameVersion((p) => p + 1)}
              >
                Zagraj jeszcze raz
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
