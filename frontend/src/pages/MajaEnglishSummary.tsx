import { useEffect } from 'react'

const QUIZ_VERSION = 3

const ENGLISH_SUMMARY = [
  {
    title: '1) Dyscypliny sportowe – pełna lista',
    points: [
      'athletics – atletyka',
      'basketball – koszykówka',
      'gymnastics – gimnastyka',
      'tennis – tenis ziemny',
      'mountain climbing – wspinaczka górska',
      'running – bieganie',
      'sailing – żeglarstwo',
      'swimming – pływanie',
      'table tennis – tenis stołowy',
      'volleyball – siatkówka',
      'yoga – joga',
    ],
  },
  {
    title: '2) Czasowniki sportowe – pełna lista',
    points: [
      'bounce – odbijać',
      'catch – łapać',
      'climb – wspinać się',
      'dive – nurkować',
      'hit – uderzać',
      'jump – skakać',
      'win – wygrać',
      'win a competition – wygrać zawody',
      'win a race – wygrać wyścig',
      'pass – podawać',
      'beat – pokonać',
      'beat a team – pokonać drużynę',
      'kick – kopać',
      'lift – podnosić',
      'score – zdobyć punkty',
      'throw – rzucić',
    ],
  },
  {
    title: '3) Przymiotniki z lekcji – pełna lista',
    points: [
      'amazing – niezwykły',
      'boring – nudny',
      'exciting – ekscytujący / pasjonujący',
      'difficult – trudny',
      'popular – popularny',
      'entertaining – zabawny / przyjemny',
      'large – ogromny',
    ],
  },
  {
    title: '4) Przykładowe zdania z lekcji – sport',
    points: [
      'She does gymnastics every day. – Ona codziennie ćwiczy gimnastykę.',
      'You need to be on the water to go sailing. – Musisz być na wodzie, aby żeglować.',
      'I like going swimming in the summer. – Lubię chodzić popływać latem.',
      'I don’t like yoga that much! – Nie lubię aż tak jogi!',
    ],
  },
  {
    title: '5) Przykładowe zdania z lekcji – czasowniki',
    points: [
      'Don’t jump into the pool! – Nie wskakuj do basenu!',
      'She will win the competition. – Ona wygra zawody / konkurs.',
      'He passed a ball to Kevin. – On podał piłkę Kevinowi.',
      'That looks heavy. Can you lift it? – To wygląda na ciężkie. Czy możesz to podnieść?',
      'How do you score in hockey? – Jak zdobywasz punkty w hokeju?',
    ],
  },
  {
    title: '6) Co koniecznie umieć przed quizem',
    points: [
      'Tłumaczyć słówka w obie strony: EN -> PL i PL -> EN.',
      'Rozpoznawać czasowniki związane ze sportem i ich znaczenia.',
      'Uzupełniać zdania poprawnym wyrazem z kontekstu.',
      'Rozumieć podstawowe zdania o sporcie i aktywności fizycznej.',
    ],
  },
]

export function MajaEnglishSummary() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Maja | Angielski - streszczenie'
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
          <h1 className="maja-title">Streszczenie lekcji</h1>
          <p className="maja-sub">Najpierw nauka, potem quiz.</p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja/historia">Quiz historia</a>
            <a className="maja-switch-link" href="/maja/historia/streszczenie">Streszczenie historia</a>
            <a className="maja-switch-link" href="/maja/angielski">Quiz angielski</a>
            <a className="maja-switch-link is-active" href="/maja/angielski/streszczenie">Streszczenie angielski</a>
          </div>
        </header>

        <section className="maja-card maja-study">
          <div className="maja-study-head">
            <h2>Cała lekcja w skrócie</h2>
            <p>Przejdź po blokach i wróć do quizu, by sprawdzić wiedzę.</p>
          </div>

          <div className="maja-study-grid">
            {ENGLISH_SUMMARY.map((block) => (
              <article key={block.title} className="maja-study-card">
                <h3>{block.title}</h3>
                <ul>
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
