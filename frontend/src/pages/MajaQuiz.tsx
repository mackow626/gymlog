import { useEffect, useMemo, useState } from 'react'

interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

const QUESTIONS_PER_GAME = 10
const QUIZ_VERSION = 2
const BEST_SCORE_KEY = 'maja_quiz_best_score'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length))
}

function createQuestionPool(): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  let idCounter = 1

  const addQuestion = (
    prompt: string,
    choices: string[],
    correctAnswer: string,
    explanation: string,
  ) => {
    const shuffledChoices = shuffle([...choices])
    questions.push({
      id: `q-${idCounter}`,
      prompt,
      choices: shuffledChoices,
      correctIndex: shuffledChoices.indexOf(correctAnswer),
      explanation,
    })
    idCounter += 1
  }

  const events = [
    { name: 'wojna Polski ze Szwecją o wybrzeża Bałtyku', year: '1600-1611' },
    { name: 'bitwa pod Kircholmem', year: '1605' },
    { name: 'potop szwedzki', year: '1655-1660' },
    { name: 'pokój w Oliwie', year: '1660' },
    { name: 'odsiecz wiedeńska Jana III Sobieskiego', year: '1683' },
    { name: 'uchwalenie Konstytucji 3 maja', year: '1791' },
    { name: 'powstanie kościuszkowskie', year: '1794' },
    { name: 'bitwa pod Maciejowicami', year: '1794' },
    { name: 'trzeci rozbiór Polski', year: '1795' },
  ]

  const allYears = [...new Set(events.map((event) => event.year))]
  const allEvents = events.map((event) => event.name)

  events.forEach((event) => {
    const yearDistractors = pickRandom(
      allYears.filter((year) => year !== event.year),
      3,
    )

    addQuestion(
      `Kiedy wydarzyło się: ${event.name}?`,
      [event.year, ...yearDistractors],
      event.year,
      `Zapamiętaj: ${event.name} miało miejsce w okresie ${event.year}.`,
    )

    const eventDistractors = pickRandom(
      allEvents.filter((name) => name !== event.name),
      3,
    )

    addQuestion(
      `Co wydarzyło się w okresie ${event.year}?`,
      [event.name, ...eventDistractors],
      event.name,
      `Zapamiętaj: w okresie ${event.year} wydarzyło się: ${event.name}.`,
    )
  })

  const people = [
    {
      name: 'Jan III Sobieski',
      role: 'król, który poprowadził odsiecz wiedeńską i pokonał Turków',
    },
    {
      name: 'Stefan Czarniecki',
      role: 'dowódca wojny podjazdowej przeciw Szwedom podczas potopu',
    },
    {
      name: 'Augustyn Kordecki',
      role: 'przeor i dowódca obrony Jasnej Góry',
    },
    {
      name: 'Kara Mustafa',
      role: 'wielki wezyr dowodzący armią turecką oblegającą Wiedeń',
    },
    {
      name: 'Tadeusz Kościuszko',
      role: 'naczelnik powstania narodowego z 1794 roku',
    },
    {
      name: 'Wojciech Bartosz Głowacki',
      role: 'kosynier, który zasłynął pod Racławicami',
    },
    {
      name: 'Stanisław August Poniatowski',
      role: 'ostatni król Polski, który abdykował po III rozbiorze',
    },
    {
      name: 'Jan Heweliusz',
      role: 'astronom, który nazwał gwiazdozbiór Tarczą Sobieskiego',
    },
  ]

  const allNames = people.map((person) => person.name)
  const allRoles = people.map((person) => person.role)

  people.forEach((person) => {
    const nameDistractors = pickRandom(
      allNames.filter((name) => name !== person.name),
      3,
    )

    addQuestion(
      `Kto to jest: ${person.role}?`,
      [person.name, ...nameDistractors],
      person.name,
      `Zapamiętaj: chodzi o postać ${person.name}.`,
    )

    const roleDistractors = pickRandom(
      allRoles.filter((role) => role !== person.role),
      3,
    )

    addQuestion(
      `Wybierz poprawny opis postaci: ${person.name}.`,
      [person.role, ...roleDistractors],
      person.role,
      `Zapamiętaj: ${person.name} to ${person.role}.`,
    )
  })

  const terms = [
    {
      term: 'odsiecz',
      definition: 'zbrojna pomoc dla oblężonego miasta lub zamku',
    },
    {
      term: 'wiktoria',
      definition: 'zwycięstwo',
    },
    {
      term: 'epidemia',
      definition: 'duża liczba zachorowań na danym terenie',
    },
    {
      term: 'powstanie',
      definition: 'zbrojne wystąpienie ludności przeciw władzy lub obcym wojskom',
    },
    {
      term: 'wielki wezyr',
      definition: 'naczelny wódz wojsk tureckich',
    },
    {
      term: 'zaborcy',
      definition: 'Rosja, Prusy i Austria, które dokonały rozbiorów Polski',
    },
    {
      term: 'kosynierzy',
      definition: 'chłopi uzbrojeni w kosy, walczący m.in. pod Racławicami',
    },
  ]

  const allTerms = terms.map((entry) => entry.term)
  const allDefinitions = terms.map((entry) => entry.definition)

  terms.forEach((entry) => {
    const definitionDistractors = pickRandom(
      allDefinitions.filter((definition) => definition !== entry.definition),
      3,
    )

    addQuestion(
      `Co oznacza pojęcie: ${entry.term}?`,
      [entry.definition, ...definitionDistractors],
      entry.definition,
      `Zapamiętaj: ${entry.term} to ${entry.definition}.`,
    )

    const termDistractors = pickRandom(
      allTerms.filter((term) => term !== entry.term),
      3,
    )

    addQuestion(
      `Które pojęcie pasuje do definicji: ${entry.definition}?`,
      [entry.term, ...termDistractors],
      entry.term,
      `Zapamiętaj: ta definicja dotyczy pojęcia ${entry.term}.`,
    )
  })

  addQuestion(
    'Dlaczego XVII wiek nazywamy stuleciem wojen?',
    [
      'Rzeczpospolita toczyła liczne wojny m.in. ze Szwecją, Rosją i Turcją',
      'Polska prowadziła tylko wojny domowe i nie walczyła z sąsiadami',
      'Panował całkowity pokój, a nazwa jest przypadkowa',
      'Rzeczpospolita walczyła tylko z Austrią',
    ],
    'Rzeczpospolita toczyła liczne wojny m.in. ze Szwecją, Rosją i Turcją',
    'Zapamiętaj: było dużo wojen z sąsiadami, dlatego to „stulecie wojen”.',
  )

  addQuestion(
    'Kto głównie stawiał opór podczas potopu szwedzkiego?',
    [
      'chłopi, mieszczanie i drobna szlachta',
      'wyłącznie magnaci',
      'wyłącznie armia zaciężna Francji',
      'tylko duchowni z Rzymu',
    ],
    'chłopi, mieszczanie i drobna szlachta',
    'Zapamiętaj: zwykli ludzie bronili swoich domów i dobytku.',
  )

  addQuestion(
    'Na czym polegała wojna podjazdowa stosowana przez Czarnieckiego?',
    [
      'na atakowaniu z zaskoczenia mniejszych oddziałów wroga',
      'na stałej obronie jednego zamku',
      'na pojedynkach dowódców na szable',
      'na walce tylko artylerią z dużej odległości',
    ],
    'na atakowaniu z zaskoczenia mniejszych oddziałów wroga',
    'Zapamiętaj: szybki atak, zaskoczenie i odwrót to sedno tej taktyki.',
  )

  addQuestion(
    'Jaki skutek miała obrona Jasnej Góry?',
    [
      'zmotywowała Polaków do dalszej walki ze Szwedami',
      'zakończyła od razu wszystkie wojny w Europie',
      'spowodowała poddanie się wojsk polskich',
      'doprowadziła do sojuszu Polski ze Szwecją',
    ],
    'zmotywowała Polaków do dalszej walki ze Szwedami',
    'Zapamiętaj: obrona Jasnej Góry dodała ludziom wiary w zwycięstwo.',
  )

  addQuestion(
    'Jaka była główna broń husarii?',
    [
      'kopia o długości nawet do 5 metrów',
      'łuk refleksyjny',
      'muszkiet lontowy',
      'halabarda',
    ],
    'kopia o długości nawet do 5 metrów',
    'Zapamiętaj: husarz najpierw uderzał długą kopią.',
  )

  addQuestion(
    'Które państwa dokonały rozbiorów Polski?',
    [
      'Rosja, Prusy i Austria',
      'Szwecja, Dania i Norwegia',
      'Hiszpania, Portugalia i Francja',
      'Turcja, Persja i Rosja',
    ],
    'Rosja, Prusy i Austria',
    'Zapamiętaj: zaborcy to Rosja, Prusy i Austria.',
  )

  addQuestion(
    'Co było bezpośrednim skutkiem upadku powstania kościuszkowskiego?',
    [
      'trzeci rozbiór Polski i utrata niepodległości',
      'natychmiastowe odzyskanie wszystkich ziem',
      'unieważnienie wszystkich rozbiorów',
      'powstanie niepodległej Litwy i Białorusi',
    ],
    'trzeci rozbiór Polski i utrata niepodległości',
    'Zapamiętaj: po klęsce powstania był III rozbiór i Polska zniknęła z mapy.',
  )

  addQuestion(
    'Gdzie dziś można zobaczyć Panoramę Racławicką?',
    [
      'we Wrocławiu, w specjalnej rotundzie',
      'w Krakowie, na Wawelu',
      'w Warszawie, w Zamku Królewskim',
      'w Gdansku, w Dworze Artusa',
    ],
    'we Wrocławiu, w specjalnej rotundzie',
    'Zapamiętaj: Panorama Racławicka znajduje się we Wrocławiu.',
  )

  addQuestion(
    'Ile lat Rzeczpospolita była poza mapą Europy po III rozbiorze?',
    ['123 lata', '33 lata', '70 lat', '200 lat'],
    '123 lata',
    'Zapamiętaj: po III rozbiorze Polska zniknęła z mapy Europy na 123 lata.',
  )

  addQuestion(
    'Które państwa (oprócz Polski) leżą dziś na obszarze dawnej Rzeczypospolitej?',
    [
      'Litwa, Łotwa, Białoruś i Ukraina',
      'Niemcy, Czechy, Słowacja i Węgry',
      'Rumunia, Bułgaria, Serbia i Chorwacja',
      'Belgia, Holandia, Luksemburg i Dania',
    ],
    'Litwa, Łotwa, Białoruś i Ukraina',
    'Zapamiętaj: to cztery państwa na obszarze dawnej Rzeczypospolitej.',
  )

  return questions
}

export function MajaQuiz() {
  const questionPool = useMemo(() => createQuestionPool(), [])
  const [gameVersion, setGameVersion] = useState(0)
  const [learningMode, setLearningMode] = useState(true)
  const [bestScore, setBestScore] = useState(0)

  const questions = useMemo(
    () => pickRandom(questionPool, QUESTIONS_PER_GAME),
    [questionPool, gameVersion],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS_PER_GAME).fill(-1))
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setAnswers(Array(QUESTIONS_PER_GAME).fill(-1))
    setFinished(false)
  }, [gameVersion])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Maja | Quiz historyczny'
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

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = answers[currentIndex]
  const hasAnsweredCurrent = selectedAnswer >= 0
  const isCurrentCorrect = hasAnsweredCurrent && selectedAnswer === currentQuestion.correctIndex

  const score = useMemo(() => {
    return questions.reduce((acc, question, index) => {
      if (answers[index] === question.correctIndex) return acc + 1
      return acc
    }, 0)
  }, [answers, questions])

  const percentage = Math.round((score / questions.length) * 100)

  useEffect(() => {
    const savedBest = Number(localStorage.getItem(BEST_SCORE_KEY) || '0')
    setBestScore(Number.isFinite(savedBest) ? savedBest : 0)
  }, [])

  useEffect(() => {
    if (!finished) return
    if (score <= bestScore) return

    setBestScore(score)
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  }, [finished, score, bestScore])

  const handleAnswer = (choiceIndex: number) => {
    if (finished) return

    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = choiceIndex
      return next
    })
  }

  const nextQuestion = () => {
    if (selectedAnswer < 0) return

    if (currentIndex === questions.length - 1) {
      setFinished(true)
      return
    }

    setCurrentIndex((prev) => prev + 1)
  }

  const previousQuestion = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const startAgain = () => {
    setGameVersion((prev) => prev + 1)
  }

  return (
    <div className="maja-shell">
      <div className="maja-glow maja-glow-a" />
      <div className="maja-glow maja-glow-b" />
      <p className="maja-version" aria-label="Wersja quizu">
        Wersja v{QUIZ_VERSION}
      </p>

      <main className="maja-wrap">
        <header className="maja-header">
          <p className="maja-kicker">Historia | Rozdział III</p>
          <h1 className="maja-title">Quiz dla Mai</h1>
          <p className="maja-sub">
            W każdej rundzie losowanych jest 10 pytań z dużej puli wygenerowanej na
            podstawie lekcji 2 i 3.
          </p>
          <div className="maja-switch">
            <a className="maja-switch-link is-active" href="/maja/historia">
              Historia
            </a>
            <a className="maja-switch-link" href="/maja/angielski">
              Angielski
            </a>
          </div>
          <p className="maja-meta">
            Aktualna pula pytań: {questionPool.length} | Najlepszy wynik: {bestScore}/10
          </p>
          <label className="maja-learn-toggle">
            <input
              type="checkbox"
              checked={learningMode}
              onChange={(event) => setLearningMode(event.target.checked)}
            />
            <span>Tryb nauki (pokazuj od razu, czy odpowiedź jest dobra)</span>
          </label>
        </header>

        {!finished && (
          <section className="maja-card">
            <div className="maja-progress-head">
              <span>
                Pytanie {currentIndex + 1}/{questions.length}
              </span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>

            <div className="maja-progress" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
              <div
                className="maja-progress-fill"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h2 className="maja-question">{currentQuestion.prompt}</h2>

            <div className="maja-answers">
              {currentQuestion.choices.map((choice, index) => {
                const isSelected = selectedAnswer === index

                return (
                  <button
                    key={`${currentQuestion.id}-${choice}`}
                    className={`maja-answer ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleAnswer(index)}
                  >
                    <span className="maja-badge">{String.fromCharCode(65 + index)}</span>
                    <span>{choice}</span>
                  </button>
                )
              })}
            </div>

            {learningMode && hasAnsweredCurrent && (
              <div className={`maja-feedback ${isCurrentCorrect ? 'ok' : 'bad'}`}>
                <p className="maja-feedback-title">
                  {isCurrentCorrect ? 'Dobra odpowiedź! Super.' : 'To jeszcze nie to.'}
                </p>
                {!isCurrentCorrect && (
                  <p>
                    Poprawna odpowiedź:{' '}
                    <strong>{currentQuestion.choices[currentQuestion.correctIndex]}</strong>
                  </p>
                )}
                <p>
                  <strong>Zapamiętaj to tak:</strong> {currentQuestion.explanation}
                </p>
              </div>
            )}

            <div className="maja-actions">
              <button className="maja-btn maja-btn-ghost" onClick={previousQuestion} disabled={currentIndex === 0}>
                Wstecz
              </button>

              <button className="maja-btn maja-btn-primary" onClick={nextQuestion} disabled={selectedAnswer < 0}>
                {currentIndex === questions.length - 1 ? 'Zakończ quiz' : 'Dalej'}
              </button>
            </div>
          </section>
        )}

        {finished && (
          <section className="maja-card maja-summary">
            <h2 className="maja-result-title">Koniec quizu</h2>
            <p className="maja-result-score">
              Wynik: <strong>{score}/10</strong> ({percentage}%)
            </p>

            <div className="maja-result-grid">
              {questions.map((question, index) => {
                const userAnswer = answers[index]
                const correct = userAnswer === question.correctIndex

                return (
                  <article key={question.id} className={`maja-result-item ${correct ? 'ok' : 'bad'}`}>
                    <h3>
                      {index + 1}. {question.prompt}
                    </h3>
                    <p>
                      Twoja odpowiedź:{' '}
                      <strong>
                        {userAnswer >= 0 ? question.choices[userAnswer] : 'brak odpowiedzi'}
                      </strong>
                    </p>
                    {!correct && <p>Poprawna odpowiedź: {question.choices[question.correctIndex]}</p>}
                    <p className="maja-explain">{question.explanation}</p>
                  </article>
                )
              })}
            </div>

            <div className="maja-actions">
              <button className="maja-btn maja-btn-primary" onClick={startAgain}>
                Zagraj jeszcze raz (losowe pytania)
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
