import { useEffect, useMemo, useState } from 'react'

interface QuizQuestion {
  id: string
  prompt: string
  type: 'choice' | 'text'
  choices?: string[]
  correctIndex?: number
  acceptedAnswers?: string[]
  explanation: string
}

type UserAnswer = number | string | null

const QUESTIONS_PER_GAME = 10
const QUIZ_VERSION = 3
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

  const addChoiceQuestion = (
    prompt: string,
    choices: string[],
    correctAnswer: string,
    explanation: string,
  ) => {
    const shuffledChoices = shuffle([...choices])
    questions.push({
      id: `en-${idCounter}`,
      prompt,
      type: 'choice',
      choices: shuffledChoices,
      correctIndex: shuffledChoices.indexOf(correctAnswer),
      explanation,
    })
    idCounter += 1
  }

  const addTextQuestion = (
    prompt: string,
    acceptedAnswers: string[],
    explanation: string,
  ) => {
    questions.push({
      id: `en-${idCounter}`,
      prompt,
      type: 'text',
      acceptedAnswers,
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

    addChoiceQuestion(
      `Co znaczy po polsku: "${entry.en}"?`,
      [entry.pl, ...plDistractors],
      entry.pl,
      `Zapamiętaj: "${entry.en}" = "${entry.pl}".`,
    )

    const enDistractors = pickRandom(
      allEn.filter((value) => value !== entry.en),
      3,
    )

    addChoiceQuestion(
      `Jak jest po angielsku: "${entry.pl}"?`,
      [entry.en, ...enDistractors],
      entry.en,
      `Zapamiętaj: "${entry.pl}" po angielsku to "${entry.en}".`,
    )

    addTextQuestion(
      `Wpisz po angielsku: "${entry.pl}"`,
      [entry.en],
      `Poprawna pisownia: "${entry.en}".`,
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
    addChoiceQuestion(
      task.prompt,
      task.choices,
      task.answer,
      task.explanation,
    )
  })

  return questions
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function makeEmptyAnswers(count: number): UserAnswer[] {
  return Array(count).fill(null)
}

function makeEmptyChecks(count: number): boolean[] {
  return Array(count).fill(false)
}

function isAnswered(question: QuizQuestion, answer: UserAnswer): boolean {
  if (question.type === 'choice') return typeof answer === 'number' && answer >= 0
  if (question.type === 'text') return typeof answer === 'string' && answer.trim().length > 0
  return false
}

function isCorrect(question: QuizQuestion, answer: UserAnswer): boolean {
  if (!isAnswered(question, answer)) return false

  if (question.type === 'choice') {
    return typeof answer === 'number' && answer === question.correctIndex
  }

  if (question.type === 'text' && typeof answer === 'string') {
    const normalized = normalizeText(answer)
    return (question.acceptedAnswers || []).some((item) => normalizeText(item) === normalized)
  }

  return false
}

function getCorrectLabel(question: QuizQuestion): string {
  if (question.type === 'choice' && question.choices && typeof question.correctIndex === 'number') {
    return question.choices[question.correctIndex]
  }

  if (question.type === 'text' && question.acceptedAnswers?.length) {
    return question.acceptedAnswers[0]
  }

  return 'brak danych'
}

function getUserAnswerLabel(question: QuizQuestion, answer: UserAnswer): string {
  if (!isAnswered(question, answer)) return 'brak odpowiedzi'

  if (question.type === 'choice' && typeof answer === 'number' && question.choices) {
    return question.choices[answer]
  }

  if (question.type === 'text' && typeof answer === 'string') {
    return answer
  }

  return 'brak odpowiedzi'
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
  const [answers, setAnswers] = useState<UserAnswer[]>(makeEmptyAnswers(QUESTIONS_PER_GAME))
  const [checked, setChecked] = useState<boolean[]>(makeEmptyChecks(QUESTIONS_PER_GAME))
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setAnswers(makeEmptyAnswers(QUESTIONS_PER_GAME))
    setChecked(makeEmptyChecks(QUESTIONS_PER_GAME))
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
  const currentAnswer = answers[currentIndex]
  const currentChecked = checked[currentIndex]
  const hasAnsweredCurrent = isAnswered(currentQuestion, currentAnswer)
  const isCurrentCorrect = currentChecked && isCorrect(currentQuestion, currentAnswer)
  const canProceedCurrent =
    currentQuestion.type === 'text'
      ? hasAnsweredCurrent && currentChecked
      : hasAnsweredCurrent

  const score = useMemo(() => {
    return questions.reduce((acc, question, index) => {
      if (isCorrect(question, answers[index])) return acc + 1
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

  const handleChoiceAnswer = (choiceIndex: number) => {
    if (finished) return

    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = choiceIndex
      return next
    })

    setChecked((prev) => {
      const next = [...prev]
      next[currentIndex] = true
      return next
    })
  }

  const handleTextAnswer = (value: string) => {
    if (finished) return

    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = value
      return next
    })

    setChecked((prev) => {
      const next = [...prev]
      next[currentIndex] = false
      return next
    })
  }

  const checkCurrentTextAnswer = () => {
    if (finished) return
    if (currentQuestion.type !== 'text') return
    if (!hasAnsweredCurrent) return

    setChecked((prev) => {
      const next = [...prev]
      next[currentIndex] = true
      return next
    })
  }

  const nextQuestion = () => {
    if (!canProceedCurrent) return

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
              Quiz historia
            </a>
            <a className="maja-switch-link" href="/maja/historia/streszczenie">
              Streszczenie historia
            </a>
            <a className="maja-switch-link is-active" href="/maja/angielski">
              Quiz angielski
            </a>
            <a className="maja-switch-link" href="/maja/angielski/streszczenie">
              Streszczenie angielski
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

            {currentQuestion.type === 'choice' && currentQuestion.choices && (
              <div className="maja-answers">
                {currentQuestion.choices.map((choice, index) => {
                  const isSelected = currentAnswer === index

                  return (
                    <button
                      key={`${currentQuestion.id}-${choice}`}
                      className={`maja-answer ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleChoiceAnswer(index)}
                    >
                      <span className="maja-badge">{String.fromCharCode(65 + index)}</span>
                      <span>{choice}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="maja-input-wrap">
                <label className="maja-input-label" htmlFor={`answer-${currentQuestion.id}`}>
                  Wpisz odpowiedź po angielsku
                </label>
                <input
                  id={`answer-${currentQuestion.id}`}
                  className="maja-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Np. swimming"
                  value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                  onChange={(event) => handleTextAnswer(event.target.value)}
                />
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <div className="maja-check-row">
                <button
                  className="maja-btn maja-btn-ghost"
                  onClick={checkCurrentTextAnswer}
                  disabled={!hasAnsweredCurrent}
                >
                  Sprawdź odpowiedź
                </button>
              </div>
            )}

            {learningMode && hasAnsweredCurrent && currentChecked && (
              <div className={`maja-feedback ${isCurrentCorrect ? 'ok' : 'bad'}`}>
                <p className="maja-feedback-title">
                  {isCurrentCorrect ? 'Dobra odpowiedź! Super.' : 'To jeszcze nie to.'}
                </p>
                {!isCurrentCorrect && (
                  <p>
                    Poprawna odpowiedź:{' '}
                    <strong>{getCorrectLabel(currentQuestion)}</strong>
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
                disabled={!canProceedCurrent}
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
                const correct = isCorrect(question, userAnswer)

                return (
                  <article key={question.id} className={`maja-result-item ${correct ? 'ok' : 'bad'}`}>
                    <h3>
                      {index + 1}. {question.prompt}
                    </h3>
                    <p>
                      Twoja odpowiedź:{' '}
                      <strong>{getUserAnswerLabel(question, userAnswer)}</strong>
                    </p>
                    {!correct && <p>Poprawna odpowiedź: {getCorrectLabel(question)}</p>}
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
