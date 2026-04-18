import { useEffect, useMemo, useState } from 'react'

interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  explanation: string
}

const QUESTIONS_PER_GAME = 10

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
    { name: 'wojna Polski ze Szwecja o wschodnie wybrzeza Baltyku', year: '1600-1611' },
    { name: 'bitwa pod Kircholmem', year: '1605' },
    { name: 'potop szwedzki', year: '1655-1660' },
    { name: 'pokoj w Oliwie', year: '1660' },
    { name: 'odsiecz wiedenska Jana III Sobieskiego', year: '1683' },
    { name: 'uchwalenie Konstytucji 3 maja', year: '1791' },
    { name: 'powstanie kosciuszkowskie', year: '1794' },
    { name: 'bitwa pod Maciejowicami', year: '1794' },
    { name: 'trzeci rozbior Polski', year: '1795' },
  ]

  const allYears = [...new Set(events.map((event) => event.year))]
  const allEvents = events.map((event) => event.name)

  events.forEach((event) => {
    const yearDistractors = pickRandom(
      allYears.filter((year) => year !== event.year),
      3,
    )

    addQuestion(
      `W ktorym okresie odbylo sie wydarzenie: ${event.name}?`,
      [event.year, ...yearDistractors],
      event.year,
      `To wydarzenie przypada na okres ${event.year}.`,
    )

    const eventDistractors = pickRandom(
      allEvents.filter((name) => name !== event.name),
      3,
    )

    addQuestion(
      `Co wydarzylo sie w okresie: ${event.year}?`,
      [event.name, ...eventDistractors],
      event.name,
      `${event.year} to data wydarzenia: ${event.name}.`,
    )
  })

  const people = [
    {
      name: 'Jan III Sobieski',
      role: 'krol, ktory poprowadzil odsiecz wiedenska i pokonal Turkow',
    },
    {
      name: 'Stefan Czarniecki',
      role: 'dowodca wojny podjazdowej przeciw Szwedom podczas potopu',
    },
    {
      name: 'Augustyn Kordecki',
      role: 'przeor i dowodca obrony Jasnej Gory',
    },
    {
      name: 'Kara Mustafa',
      role: 'wielki wezyr dowodzacy armia turecka oblegajaca Wieden',
    },
    {
      name: 'Tadeusz Kosciuszko',
      role: 'naczelnik powstania narodowego z 1794 roku',
    },
    {
      name: 'Wojciech Bartos Glowacki',
      role: 'kosynier, ktory gaszac lont armaty wslawil sie pod Raclawicami',
    },
    {
      name: 'Stanislaw August Poniatowski',
      role: 'ostatni krol Polski, ktory abdykowal po III rozbiorze',
    },
    {
      name: 'Jan Heweliusz',
      role: 'astronom, ktory nazwal gwiazdozbior Tarcza Sobieskiego',
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
      `To postac: ${person.name}.`,
    )

    const roleDistractors = pickRandom(
      allRoles.filter((role) => role !== person.role),
      3,
    )

    addQuestion(
      `Zaznacz poprawny opis postaci: ${person.name}.`,
      [person.role, ...roleDistractors],
      person.role,
      `Poprawny opis to: ${person.role}.`,
    )
  })

  const terms = [
    {
      term: 'odsiecz',
      definition: 'zbrojna pomoc dla oblezonego miasta lub zamku',
    },
    {
      term: 'wiktoria',
      definition: 'zwyciestwo',
    },
    {
      term: 'epidemia',
      definition: 'duza liczba zachorowan na danym terenie',
    },
    {
      term: 'powstanie',
      definition: 'zbrojne wystapienie ludnosci przeciw wladzy lub obcym wojskom',
    },
    {
      term: 'wielki wezyr',
      definition: 'naczelny wodz wojsk tureckich',
    },
    {
      term: 'zaborcy',
      definition: 'Rosja, Prusy i Austria dokonujace rozbiorow Polski',
    },
    {
      term: 'kosynierzy',
      definition: 'chlopi uzbrojeni w kosy, walczacy m.in. pod Raclawicami',
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
      `Co oznacza pojecie: ${entry.term}?`,
      [entry.definition, ...definitionDistractors],
      entry.definition,
      `Definicja pojecia ${entry.term}: ${entry.definition}.`,
    )

    const termDistractors = pickRandom(
      allTerms.filter((term) => term !== entry.term),
      3,
    )

    addQuestion(
      `Ktore pojecie pasuje do definicji: ${entry.definition}?`,
      [entry.term, ...termDistractors],
      entry.term,
      `Ta definicja dotyczy pojecia: ${entry.term}.`,
    )
  })

  addQuestion(
    'Dlaczego XVII wiek nazwano stuleciem wojen?',
    [
      'Rzeczpospolita toczyla liczne wojny m.in. ze Szwecja, Rosja i Turcja',
      'Polska prowadzila tylko wojny domowe i nie walczyla z sasiadami',
      'Panowal calkowity pokoj, ale nazwa byla umowna',
      'Rzeczpospolita walczyla jedynie z Austria',
    ],
    'Rzeczpospolita toczyla liczne wojny m.in. ze Szwecja, Rosja i Turcja',
    'W XVII wieku Rzeczpospolita byla uwiklana w liczne konflikty zbrojne.',
  )

  addQuestion(
    'Kto glownie stawial opor podczas potopu szwedzkiego?',
    [
      'chlopi, mieszczanie i drobna szlachta',
      'wylacznie magnaci',
      'wylacznie armia zaciagowa Francji',
      'tylko duchowni z Rzymu',
    ],
    'chlopi, mieszczanie i drobna szlachta',
    'Wlasnie te grupy bronily dorobku i stawialy opor najezdzcy.',
  )

  addQuestion(
    'Na czym polegala wojna podjazdowa stosowana przez Czarnieckiego?',
    [
      'na znienacka atakowaniu mniejszych oddzialow wroga',
      'na stalej obronie jednego zamku',
      'na pojedynkach dowodcow na szable',
      'na walce tylko artyleria z duzej odleglosci',
    ],
    'na znienacka atakowaniu mniejszych oddzialow wroga',
    'To taktyka szybkich i zaskakujacych atakow na oslabione oddzialy przeciwnika.',
  )

  addQuestion(
    'Jaki skutek miala obrona Jasnej Gory?',
    [
      'zmotywowala Polakow do dalszej walki ze Szwedami',
      'zakonczyla natychmiast wszystkie wojny w Europie',
      'spowodowala poddanie sie wojsk polskich',
      'doprowadzila do sojuszu Polski ze Szwecja',
    ],
    'zmotywowala Polakow do dalszej walki ze Szwedami',
    'Zwyciestwo podnioslo morale i stalo sie waznym symbolem oporu.',
  )

  addQuestion(
    'Jaka byla glowna bron husarii?',
    [
      'kopia o dlugosci nawet do 5 metrow',
      'luk refleksyjny',
      'muszkiet lontowy',
      'halabarda',
    ],
    'kopia o dlugosci nawet do 5 metrow',
    'Kopia stanowila podstawowa bron uderzeniowa husarza.',
  )

  addQuestion(
    'Ktore panstwa dokonaly rozbiorow Polski?',
    [
      'Rosja, Prusy i Austria',
      'Szwecja, Dania i Norwegia',
      'Hiszpania, Portugalia i Francja',
      'Turcja, Persja i Rosja',
    ],
    'Rosja, Prusy i Austria',
    'To te trzy panstwa byly zaborcami Rzeczypospolitej.',
  )

  addQuestion(
    'Co bylo bezposrednim skutkiem upadku powstania kosciuszkowskiego?',
    [
      'trzeci rozbior Polski i utrata niepodleglosci',
      'natychmiastowe odzyskanie wszystkich ziem',
      'uniewaznienie wszystkich rozbiorow',
      'powstanie niepodleglej Litwy i Bialorusi',
    ],
    'trzeci rozbior Polski i utrata niepodleglosci',
    'Po klesce powstania doszlo do trzeciego rozbioru i zaniku panstwa z mapy.',
  )

  addQuestion(
    'Gdzie dzis mozna zobaczyc Panorame Raclawicka?',
    [
      'we Wroclawiu, w specjalnej rotundzie',
      'w Krakowie, na Wawelu',
      'w Warszawie, w Zamku Krolewskim',
      'w Gdansku, w Dworze Artusa',
    ],
    'we Wroclawiu, w specjalnej rotundzie',
    'Panorama Raclawicka jest eksponowana we Wroclawiu.',
  )

  addQuestion(
    'Ile lat Rzeczpospolita pozostawala poza mapa Europy po III rozbiorze?',
    ['123 lata', '33 lata', '70 lat', '200 lat'],
    '123 lata',
    'Po III rozbiorze Polska zniknela z mapy Europy na 123 lata.',
  )

  addQuestion(
    'Ktore panstwa (oprocz Polski) leza dzis na obszarze dawnej Rzeczypospolitej?',
    [
      'Litwa, Lotwa, Bialorus i Ukraina',
      'Niemcy, Czechy, Slowacja i Wegry',
      'Rumunia, Bulgaria, Serbia i Chorwacja',
      'Belgia, Holandia, Luksemburg i Dania',
    ],
    'Litwa, Lotwa, Bialorus i Ukraina',
    'Wlasnie te cztery panstwa wymieniono we fragmencie o sladach dawnej Rzeczypospolitej.',
  )

  return questions
}

export function MajaQuiz() {
  const questionPool = useMemo(() => createQuestionPool(), [])
  const [gameVersion, setGameVersion] = useState(0)
  const [learningMode, setLearningMode] = useState(true)

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

      <main className="maja-wrap">
        <header className="maja-header">
          <p className="maja-kicker">Historia | Rozdzial III</p>
          <h1 className="maja-title">Quiz dla Mai</h1>
          <p className="maja-sub">
            W kazdej rundzie losowanych jest 10 pytan z duzej puli automatycznie generowanej
            na podstawie lekcji 2 i 3.
          </p>
          <p className="maja-meta">Aktualna pula pytan: {questionPool.length}</p>
          <label className="maja-learn-toggle">
            <input
              type="checkbox"
              checked={learningMode}
              onChange={(event) => setLearningMode(event.target.checked)}
            />
            <span>Tryb nauki (pokaz od razu, czy odpowiedz jest dobra)</span>
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
                  {isCurrentCorrect ? 'Dobra odpowiedz! Super.' : 'To jeszcze nie to.'}
                </p>
                {!isCurrentCorrect && (
                  <p>
                    Poprawna odpowiedz: <strong>{currentQuestion.choices[currentQuestion.correctIndex]}</strong>
                  </p>
                )}
                <p>{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="maja-actions">
              <button className="maja-btn maja-btn-ghost" onClick={previousQuestion} disabled={currentIndex === 0}>
                Wstecz
              </button>

              <button className="maja-btn maja-btn-primary" onClick={nextQuestion} disabled={selectedAnswer < 0}>
                {currentIndex === questions.length - 1 ? 'Zakoncz quiz' : 'Dalej'}
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
                      Twoja odpowiedz:{' '}
                      <strong>
                        {userAnswer >= 0 ? question.choices[userAnswer] : 'brak odpowiedzi'}
                      </strong>
                    </p>
                    {!correct && <p>Poprawna odpowiedz: {question.choices[question.correctIndex]}</p>}
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
