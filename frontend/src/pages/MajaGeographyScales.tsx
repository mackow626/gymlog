import { useEffect, useMemo, useState } from 'react'

const QUIZ_VERSION = 1

/* ── helpers ──────────────────────────────────────────────── */

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*[–—-]\s*/g, '-')
    .replace(/\s/g, '')
}

function check(typed: string, accepted: string[]): boolean {
  const n = norm(typed)
  return accepted.some((a) => norm(a) === n)
}

/* ── exercise data ────────────────────────────────────────── */

interface Q {
  id: string
  label: string
  answers: string[]   // first entry is displayed as the correct answer
  hint?: string
  note?: string       // extra context shown above the field
  wide?: boolean      // span full width in grid
}

interface Ex {
  id: number
  title: string
  pts: number
  intro: string
  note?: string
  questions: Q[]
}

const EXERCISES: Ex[] = [
  {
    id: 1,
    title: 'Rodzaje skali',
    pts: 3,
    intro: 'Pod każdą skalą napisz, jak się nazywa: liczbowa, mianowana czy liniowa.',
    questions: [
      { id: 'a', label: 'A — 1 : 50 000', answers: ['liczbowa'] },
      { id: 'b', label: 'B — 1 cm – 500 m', answers: ['mianowana'] },
      { id: 'c', label: 'C — skala z podziałką (graficzna)', answers: ['liniowa'] },
      {
        id: 'taknie',
        label: 'Czy skale A, B i C oznaczają to samo? (TAK / NIE)',
        answers: ['tak'],
        hint: 'Wszystkie trzy oznaczają: 1 cm na mapie = 500 m w terenie.',
        wide: true,
      },
    ],
  },
  {
    id: 2,
    title: 'Zamień skalę',
    pts: 6,
    intro: 'Uzupełnij brakującą kolumnę w tabeli.',
    questions: [
      { id: 'r1', label: '1 : 100 000  →  1 cm –', answers: ['1 km', '1km'] },
      { id: 'r2', label: '1 : 25 000  →  1 cm –', answers: ['250 m', '250m'] },
      { id: 'r3', label: '1 : 2 000 000  →  1 cm –', answers: ['20 km', '20km'] },
      { id: 'r4', label: '1 cm – 3 km  →  1 :', answers: ['300 000', '300000'] },
      { id: 'r5', label: '1 cm – 50 m  →  1 :', answers: ['5 000', '5000'] },
      { id: 'r6', label: '1 : 500  →  1 cm –', answers: ['5 m', '5m'] },
    ],
  },
  {
    id: 3,
    title: 'Odczytaj skalę liniową',
    pts: 4,
    intro: 'Na skali liniowej każdy odcinek ma 1 cm. Skala pokazuje: 0 – 2 – 4 – 6 – 8 – 10 km.',
    questions: [
      { id: 'a', label: 'a) Ilu kilometrom odpowiada 1 cm na mapie?', answers: ['2 km', '2km', '2'] },
      { id: 'b', label: 'b) Skala mianowana:', answers: ['1 cm – 2 km', '1cm-2km'] },
      { id: 'c', label: 'c) Skala liczbowa:', answers: ['1 : 200 000', '1:200000', '1:200 000'] },
      { id: 'd', label: 'd) Odcinek 3,5 cm na mapie = ? km w terenie', answers: ['7 km', '7km', '7'], hint: '3,5 × 2 km = 7 km' },
    ],
  },
  {
    id: 4,
    title: 'Wędrówka po okolicy',
    pts: 5,
    intro: 'Mapa okolicy wsi Zielonka, skala 1 : 50 000 (1 cm = 500 m).',
    note: '📏 W wersji online podano wyniki pomiaru linijką: Zielonka–Brzozów = 4 cm, Brzozów–Młynek = 3 cm, Zielonka–Młynek (ścieżką) = 5 cm.',
    questions: [
      {
        id: 'a',
        label: 'a) Zielonka – Brzozów: na mapie 4 cm → w terenie [km]',
        answers: ['2 km', '2km', '2'],
        hint: '4 × 500 m = 2000 m = 2 km',
      },
      {
        id: 'b',
        label: 'b) Brzozów – Młynek: na mapie 3 cm → w terenie [km]',
        answers: ['1,5 km', '1.5 km', '1,5km', '1.5km', '1,5', '1.5'],
        hint: '3 × 500 m = 1500 m = 1,5 km',
      },
      {
        id: 'c',
        label: 'c) Zielonka – Młynek (ścieżką): 5 cm → w terenie [km]',
        answers: ['2,5 km', '2.5 km', '2,5', '2.5'],
        hint: '5 × 500 m = 2500 m = 2,5 km',
      },
      {
        id: 'd1',
        label: 'd) Droga przez Brzozów: Zielonka→Brzozów + Brzozów→Młynek = ? km',
        answers: ['3,5 km', '3.5 km', '3,5', '3.5'],
        hint: '2 km + 1,5 km = 3,5 km',
      },
      {
        id: 'd2',
        label: 'd) O ile jest dłuższa od ścieżki przez las? [km]',
        answers: ['1 km', '1km', '1'],
        hint: '3,5 km − 2,5 km = 1 km',
      },
    ],
  },
  {
    id: 5,
    title: 'Plan boiska szkolnego',
    pts: 4,
    intro: 'Plan boiska, skala 1 : 1 000.',
    note: '📏 Zmierzono na planie: długość boiska = 8 cm, szerokość = 5 cm.',
    questions: [
      { id: 'a', label: 'a) Skala mianowana planu:', answers: ['1 cm – 10 m', '1cm-10m'] },
      {
        id: 'b1',
        label: 'b) Rzeczywista długość boiska [m]',
        answers: ['80 m', '80m', '80'],
        hint: '8 cm × 10 m/cm = 80 m',
      },
      {
        id: 'b2',
        label: 'b) Rzeczywista szerokość boiska [m]',
        answers: ['50 m', '50m', '50'],
        hint: '5 cm × 10 m/cm = 50 m',
      },
      {
        id: 'c',
        label: 'c) Obwód boiska [m]',
        answers: ['260 m', '260m', '260'],
        hint: '2 × (80 + 50) = 260 m',
      },
      {
        id: 'd',
        label: 'd) Kasia obiega boisko 2 razy → ile metrów? [m]',
        answers: ['520 m', '520m', '520'],
        hint: '2 × 260 = 520 m',
      },
    ],
  },
  {
    id: 6,
    title: 'Oblicz odległość w terenie',
    pts: 4,
    intro: 'Najpierw zamień skalę na mianowaną, potem oblicz.',
    questions: [
      {
        id: 'a',
        label: 'a) Skala 1 : 200 000, odległość na mapie 7 cm → [km]',
        answers: ['14 km', '14km', '14'],
        hint: '1 cm – 2 km; 7 × 2 = 14 km',
      },
      {
        id: 'b',
        label: 'b) Skala 1 : 25 000, szlak na mapie 12 cm → [km]',
        answers: ['3 km', '3km', '3'],
        hint: '1 cm – 250 m; 12 × 250 = 3000 m = 3 km',
      },
      {
        id: 'c',
        label: 'c) Skala 1 : 10 000, ulica na planie 4,5 cm → [m]',
        answers: ['450 m', '450m', '450'],
        hint: '1 cm – 100 m; 4,5 × 100 = 450 m',
      },
      {
        id: 'd',
        label: 'd) Skala 1 : 1 000 000, rzeka na mapie 2,5 cm → [km]',
        answers: ['25 km', '25km', '25'],
        hint: '1 cm – 10 km; 2,5 × 10 = 25 km',
      },
    ],
  },
  {
    id: 7,
    title: 'Oblicz długość odcinka na mapie',
    pts: 6,
    intro: 'Oblicz, jaką długość (w cm) będzie miał odcinek na mapie.',
    note: '📏 W wersji papierowej należy też narysować odcinek linijką — tu wpisz tylko obliczoną wartość.',
    questions: [
      {
        id: 'a',
        label: 'a) 15 km w terenie, mapa 1 : 500 000 → ? cm',
        answers: ['3 cm', '3cm', '3'],
        hint: '1 cm – 5 km; 15 ÷ 5 = 3 cm',
      },
      {
        id: 'b',
        label: 'b) 800 m w terenie, plan 1 : 10 000 → ? cm',
        answers: ['8 cm', '8cm', '8'],
        hint: '1 cm – 100 m; 800 ÷ 100 = 8 cm',
      },
      {
        id: 'c',
        label: 'c) 4,5 km w terenie, mapa 1 : 100 000 → ? cm',
        answers: ['4,5 cm', '4.5 cm', '4,5', '4.5'],
        hint: '1 cm – 1 km; 4,5 ÷ 1 = 4,5 cm',
      },
    ],
  },
  {
    id: 8,
    title: 'Większa czy mniejsza skala?',
    pts: 7,
    intro: 'Im mniejsza liczba po dwukropku, tym większa skala. Wpisz <, > lub = między skalami.',
    questions: [
      {
        id: 'cmp1',
        label: '1 : 5 000  ☐  1 : 50 000',
        answers: ['>'],
        hint: '5 000 < 50 000, więc 1:5 000 jest większą skalą → >',
      },
      {
        id: 'cmp2',
        label: '1 cm – 1 km  ☐  1 : 100 000',
        answers: ['='],
        hint: '1 cm – 1 km = 1 : 100 000, bo 1 km = 100 000 cm → =',
      },
      {
        id: 'cmp3',
        label: '1 : 1 000 000  ☐  1 : 100 000',
        answers: ['<'],
        hint: '1 000 000 > 100 000, więc 1:1 000 000 jest mniejszą skalą → <',
      },
      {
        id: 'cmp4',
        label: '1 : 20 000  ☐  1 cm – 2 km',
        answers: ['>'],
        hint: '1 cm – 2 km = 1:200 000; 20 000 < 200 000 → 1:20 000 jest większą skalą → >',
      },
      {
        id: 'lakeA',
        label: 'b) Długość jeziora na mapie A (skala 1:10 000) → [cm]',
        answers: ['6 cm', '6cm', '6'],
        hint: 'Na mapie A jezioro ma 6 cm',
        note: '📏 Wyniki pomiaru: mapa A = 6 cm, mapa B = 3 cm.',
      },
      {
        id: 'lakeB',
        label: 'Długość jeziora na mapie B → [cm]',
        answers: ['3 cm', '3cm', '3'],
        hint: 'Na mapie B jezioro ma 3 cm',
      },
      {
        id: 'lakeReal',
        label: 'Rzeczywista długość jeziora [m] (na podstawie mapy A)',
        answers: ['600 m', '600m', '600'],
        hint: '6 cm × 100 m/cm = 600 m',
      },
      {
        id: 'scaleB',
        label: 'Skala mapy B: 1 : ?',
        answers: ['20 000', '20000', '1:20 000', '1:20000'],
        hint: 'Jezioro na B jest 2× krótsze → skala 2× mniejsza → 1:20 000',
      },
    ],
  },
  {
    id: 9,
    title: 'Droga do szkoły',
    pts: 4,
    intro: 'Plan miasta, skala 1 : 20 000. Droga Oli z domu do szkoły ma na planie 9 cm.',
    questions: [
      {
        id: 'a1',
        label: 'a) Ile metrów ma droga Oli? [m]',
        answers: ['1800 m', '1800m', '1800'],
        hint: '1 cm – 200 m; 9 × 200 = 1800 m',
      },
      {
        id: 'a2',
        label: 'a) Ile to kilometrów? [km]',
        answers: ['1,8 km', '1.8 km', '1,8', '1.8'],
        hint: '1800 m = 1,8 km',
      },
      {
        id: 'b',
        label: 'b) Ile km pokonuje Ola w ciągu 5 dni (tam i z powrotem)?',
        answers: ['18 km', '18km', '18'],
        hint: '1,8 km × 2 × 5 = 18 km',
      },
      {
        id: 'c',
        label: 'c) Kuba mieszka 1,2 km od szkoły. Ile cm ma jego droga na tym planie?',
        answers: ['6 cm', '6cm', '6'],
        hint: '1200 m ÷ 200 m/cm = 6 cm',
      },
    ],
  },
  {
    id: 10,
    title: 'Dobierz skalę',
    pts: 5,
    intro: 'Dopasuj skalę do mapy (wpisz literę: A, B, C lub D).',
    questions: [
      {
        id: 's1',
        label: '1 : 2 500 000 →',
        answers: ['C', 'c'],
        hint: 'Skala 1:2 500 000 odpowiada mapie Polski (C)',
      },
      {
        id: 's2',
        label: '1 : 100 →',
        answers: ['A', 'a'],
        hint: 'Skala 1:100 odpowiada planowi mieszkania (A)',
      },
      {
        id: 's3',
        label: '1 : 80 000 000 →',
        answers: ['D', 'd'],
        hint: 'Skala 1:80 000 000 odpowiada mapie świata (D)',
      },
      {
        id: 's4',
        label: '1 : 15 000 →',
        answers: ['B', 'b'],
        hint: 'Skala 1:15 000 odpowiada planowi miasta (B)',
      },
      {
        id: 'rajd',
        label: 'b) Trasa rajdu = 30 km, kartka 20 cm. Która skala? (A / B / C)',
        answers: ['B', 'b'],
        hint: '1:200 000 → 1 cm – 2 km; 30 ÷ 2 = 15 cm ✓ mieści się. 1:100 000 → 30 cm ✗; 1:50 000 → 60 cm ✗',
        wide: true,
      },
    ],
  },
]

/* ── state helpers ─────────────────────────────────────────── */

type Answers = Record<string, string>
type Checked = Set<number>

function exKey(exId: number, qId: string) { return `${exId}-${qId}` }

function scoreExercise(ex: Ex, answers: Answers): { got: number; max: number } {
  const max = ex.pts
  // count correct questions (simplified: 1 pt per question, scaled to pts)
  const correct = ex.questions.filter((q) => check(answers[exKey(ex.id, q.id)] || '', q.answers)).length
  // some exercises have unequal distribution – approximate
  const got = Math.round((correct / ex.questions.length) * max)
  return { got, max }
}

/* ── component ─────────────────────────────────────────────── */

export function MajaGeographyScales() {
  const [answers, setAnswers] = useState<Answers>({})
  const [checked, setChecked] = useState<Checked>(new Set())
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const prev = document.title
    document.title = 'Maja | Skala na mapie'
    document.body.classList.add('maja-body')
    let meta = document.querySelector('meta[name="robots"]')
    const created = !meta
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'robots'); document.head.appendChild(meta) }
    meta.setAttribute('content', 'noindex, nofollow')
    return () => {
      document.title = prev
      document.body.classList.remove('maja-body')
      if (created && meta?.parentNode) meta.parentNode.removeChild(meta)
    }
  }, [])

  const totalScore = useMemo(() => {
    if (!submitted) return null
    return EXERCISES.reduce((acc, ex) => {
      const { got, max } = scoreExercise(ex, answers)
      return { got: acc.got + got, max: acc.max + max }
    }, { got: 0, max: 0 })
  }, [submitted, answers])

  const setAnswer = (exId: number, qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [exKey(exId, qId)]: value }))
  }

  const checkExercise = (exId: number) => {
    setChecked((prev) => new Set([...prev, exId]))
  }

  const resetAll = () => {
    setAnswers({})
    setChecked(new Set())
    setSubmitted(false)
  }

  return (
    <div className="maja-shell">
      <div className="maja-glow maja-glow-a" />
      <div className="maja-glow maja-glow-b" />
      <p className="maja-version">Wersja v{QUIZ_VERSION}</p>

      <main className="maja-wrap">
        <header className="maja-header">
          <p className="maja-kicker">Geografia · klasa 5</p>
          <h1 className="maja-title">Skala na mapie</h1>
          <p className="maja-sub">
            Karta pracy — wpisz odpowiedzi i kliknij „Sprawdź" pod każdym zadaniem.
            Zadania oznaczone 📏 wymagają linijki w wersji papierowej — tutaj podano zmierzone wartości.
          </p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja">Hub</a>
            <a className="maja-switch-link" href="/maja/angielski">Quiz angielski</a>
            <a className="maja-switch-link is-active" href="/maja/geografia/skala">Skala na mapie</a>
          </div>
          <p className="maja-meta">Łącznie: 48 pkt</p>
        </header>

        {/* Ściąga */}
        <div className="mgeo-cheatsheet">
          <strong>Ściąga:</strong> 1 km = 1 000 m = 100 000 cm · 1 m = 100 cm.{' '}
          Skreślaj zera: 2 zera → metry, 5 zer → kilometry.{' '}
          Np. 1 : 50 000 → 1 cm – 500 m · 1 : 300 000 → 1 cm – 3 km.
        </div>

        {EXERCISES.map((ex) => {
          const isChecked = checked.has(ex.id)
          return (
            <section key={ex.id} className="maja-card mgeo-exercise">
              {/* Header */}
              <div className="mgeo-ex-head">
                <div className="mgeo-ex-badge">{ex.id}</div>
                <div>
                  <h2 className="mgeo-ex-title">{ex.title}</h2>
                  <p className="mgeo-ex-intro">{ex.intro}</p>
                  {ex.note && <p className="mgeo-note">{ex.note}</p>}
                </div>
                <div className="mgeo-ex-pts">{ex.pts} pkt</div>
              </div>

              {/* Questions */}
              <div className="mgeo-questions">
                {ex.questions.map((q) => {
                  const key = exKey(ex.id, q.id)
                  const val = answers[key] || ''
                  const correct = isChecked ? check(val, q.answers) : null

                  return (
                    <div
                      key={q.id}
                      className={`mgeo-qrow${q.wide ? ' mgeo-qrow-wide' : ''}`}
                    >
                      {q.note && (
                        <p className="mgeo-note" style={{ marginBottom: '0.4rem' }}>
                          {q.note}
                        </p>
                      )}
                      <label className="mgeo-qlabel">{q.label}</label>
                      <div className="mgeo-qinput-wrap">
                        <input
                          className={`mgeo-input${
                            correct === true ? ' is-correct' : correct === false ? ' is-wrong' : ''
                          }`}
                          type="text"
                          autoComplete="off"
                          spellCheck={false}
                          value={val}
                          placeholder="Wpisz odpowiedź"
                          onChange={(e) => setAnswer(ex.id, q.id, e.target.value)}
                        />
                        {correct === true && <span className="mgeo-icon ok">✓</span>}
                        {correct === false && (
                          <span className="mgeo-icon bad">✗</span>
                        )}
                      </div>
                      {correct === false && q.hint && (
                        <p className="mgeo-hint">
                          Poprawnie: <strong>{q.answers[0]}</strong>
                          {q.hint !== q.answers[0] ? ` — ${q.hint}` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Per-exercise footer */}
              <div className="mgeo-ex-foot">
                {isChecked && (
                  <span className="mgeo-ex-score">
                    {(() => {
                      const { got, max } = scoreExercise(ex, answers)
                      return `~${got} / ${max} pkt`
                    })()}
                  </span>
                )}
                <button
                  className="maja-btn maja-btn-ghost"
                  onClick={() => checkExercise(ex.id)}
                >
                  {isChecked ? 'Sprawdź ponownie' : 'Sprawdź zadanie'}
                </button>
              </div>
            </section>
          )
        })}

        {/* Final submit */}
        <div className="maja-card mgeo-final">
          {submitted && totalScore && (
            <div className="mgeo-total">
              <p className="mgeo-total-label">Twój wynik</p>
              <p className="mgeo-total-score">
                ~{totalScore.got} / {totalScore.max} pkt
              </p>
              <p className="mgeo-total-grade">
                {totalScore.got >= 46 ? '🏆 Celujący'
                  : totalScore.got >= 40 ? '⭐ Bardzo dobry'
                  : totalScore.got >= 31 ? '👍 Dobry'
                  : totalScore.got >= 23 ? '📚 Dostateczny'
                  : totalScore.got >= 14 ? '📖 Dopuszczający'
                  : '💪 Ćwicz dalej!'}
              </p>
            </div>
          )}
          <div className="maja-actions">
            <button
              className="maja-btn maja-btn-primary"
              onClick={() => { EXERCISES.forEach((ex) => checkExercise(ex.id)); setSubmitted(true) }}
            >
              Sprawdź wszystkie i podsumuj wynik
            </button>
            <button className="maja-btn maja-btn-ghost" onClick={resetAll}>
              Zacznij od nowa
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
