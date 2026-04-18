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
const BEST_SCORE_KEY = 'maja_english_best_score'

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

function createEnglishQuestionPool(): QuizQuestion[] {
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
      id: `en-${idCounter}`,
      prompt,
      choices: shuffledChoices,
      correctIndex: shuffledChoices.indexOf(correctAnswer),
      explanation,
    })
    idCounter += 1
  }

  const vocab = [
    { en: 'athletics', pl: 'atletyka' },
    { en: 'basketball', pl: 'koszykówka' },
    { en: 'gymnastics', pl: 'gimnastyka' },
    { en: 'tennis', pl: 'tenis ziemny' },
    { en: 'mountain climbing', pl: 'wspinaczka górska' },
    { en: 'running', pl: 'bieganie' },
    { en: 'sailing', pl: 'żeglarstwo' },
    { en: 'swimming', pl: 'pływanie' },
    { en: 'table tennis', pl: 'tenis stołowy' },
    { en: 'volleyball', pl: 'siatkówka' },
    { en: 'yoga', pl: 'joga' },
    { en: 'bounce', pl: 'odbijać' },
    { en: 'catch', pl: 'łapać' },
    { en: 'climb', pl: 'wspinać się' },
    { en: 'dive', pl: 'nurkować' },
    { en: 'hit', pl: 'uderzać' },
    { en: 'jump', pl: 'skakać' },
    { en: 'win', pl: 'wygrać' },
    { en: 'win a competition', pl: 'wygrać zawody' },
    { en: 'win a race', pl: 'wygrać wyścig' },
    { en: 'pass', pl: 'podawać' },
    { en: 'beat', pl: 'pokonać' },
    { en: 'beat a team', pl: 'pokonać drużynę' },
    { en: 'kick', pl: 'kopać' },
    { en: 'lift', pl: 'podnosić' },
    { en: 'score', pl: 'zdobyć punkty' },
    { en: 'throw', pl: 'rzucić' },
    { en: 'amazing', pl: 'niezwykły' },
    { en: 'boring', pl: 'nudny' },
    { en: 'exciting', pl: 'ekscytujący' },
    { en: 'difficult', pl: 'trudny' },
    { en: 'popular', pl: 'popularny' },
    { en: 'entertaining', pl: 'zabawny' },
    { en: 'large', pl: 'ogromny' },
  ]

  const allEn = vocab.map((entry) => entry.en)
  const allPl = vocab.map((entry) => entry.pl)

  vocab.forEach((entry) => {
    const plDistractors = pickRandom(
      allPl.filter((value) => value !== entry.pl),
      3,
    )

    addQuestion(
      `Co znaczy po polsku: "${entry.en}"?`,
      [entry.pl, ...plDistractors],
      entry.pl,
      `Zapamiętaj: "${entry.en}" = "${entry.pl}".`,
    )

    const enDistractors = pickRandom(
      allEn.filter((value) => value !== entry.en),
      3,
    )

    addQuestion(
      `Jak jest po angielsku: "${entry.pl}"?`,
      [entry.en, ...enDistractors],
      entry.en,
      `Zapamiętaj: "${entry.pl}" po angielsku to "${entry.en}".`,
    )
  })

  const sentenceTasks = [
    {
      prompt: 'Uzupełnij zdanie: She ___ gymnastics every day.',
      answer: 'does',
      choices: ['does', 'plays', 'wins', 'throws'],
      explanation: 'Przy "gymnastics" używamy czasownika "do": she does gymnastics.',
    },
    {
      prompt: 'Uzupełnij zdanie: You need to be on the water to go ___.',
      answer: 'sailing',
      choices: ['sailing', 'running', 'yoga', 'basketball'],
      explanation: 'Po wodzie poruszamy się podczas "sailing".',
    },
    {
      prompt: 'Uzupełnij zdanie: I like going ___ in the summer.',
      answer: 'swimming',
      choices: ['swimming', 'volleyball', 'mountain climbing', 'table tennis'],
      explanation: 'W zdaniu występuje poprawna forma: going swimming.',
    },
    {
      prompt: 'Uzupełnij zdanie: Don’t ___ into the pool!',
      answer: 'jump',
      choices: ['jump', 'catch', 'lift', 'score'],
      explanation: 'W tym zdaniu pasuje czasownik "jump" (wskakiwać).',
    },
    {
      prompt: 'Uzupełnij zdanie: She will ___ the competition.',
      answer: 'win',
      choices: ['win', 'beat', 'throw', 'dive'],
      explanation: 'Poprawna forma to "win the competition".',
    },
    {
      prompt: 'Uzupełnij zdanie: He ___ a ball to Kevin.',
      answer: 'passed',
      choices: ['passed', 'beat', 'kicked', 'climbed'],
      explanation: 'W czasie przeszłym poprawnie: passed a ball.',
    },
    {
      prompt: 'Uzupełnij zdanie: Can you ___ it?',
      answer: 'lift',
      choices: ['lift', 'dive', 'bounce', 'score'],
      explanation: 'Przy ciężkim przedmiocie używamy "lift".',
    },
    {
      prompt: 'Uzupełnij zdanie: How do you ___ in hockey?',
      answer: 'score',
      choices: ['score', 'throw', 'climb', 'sail'],
      explanation: 'W hokeju zdobywa się punkty, czyli "score".',
    },
  ]

  sentenceTasks.forEach((task) => {
    addQuestion(
      task.prompt,
      task.choices,
      task.answer,
      task.explanation,
    )
  })

  return questions
}

export function MajaEnglishQuiz() {
  const questionPool = useMemo(() => createEnglishQuestionPool(), [])
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
    document.title = 'Maja | Quiz angielski'
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
          <p className="maja-kicker">Angielski | Sport</p>
          <h1 className="maja-title">Quiz dla Mai</h1>
          <p className="maja-sub">
            Ćwiczymy słówka i zdania o sporcie. W każdej rundzie losowanych jest 10 pytań.
          </p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja/historia">
              Historia
            </a>
            <a className="maja-switch-link is-active" href="/maja/angielski">
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

            <div
              className="maja-progress"
              role="progressbar"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={questions.length}
            >
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
              <button
                className="maja-btn maja-btn-ghost"
                onClick={previousQuestion}
                disabled={currentIndex === 0}
              >
                Wstecz
              </button>

              <button
                className="maja-btn maja-btn-primary"
                onClick={nextQuestion}
                disabled={selectedAnswer < 0}
              >
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
