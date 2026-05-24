import { useEffect } from 'react'

const QUIZ_VERSION = 3

export function MajaHub() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Maja | Wybór quizu'
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
          <p className="maja-kicker">Strefa Mai</p>
          <h1 className="maja-title">Wybierz quiz</h1>
          <p className="maja-sub">
            Tutaj są dwie osobne podstrony: historia i angielski. Każda ma losowe pytania,
            podsumowanie wyniku i opcję ponownej gry.
          </p>
        </header>

        <section className="maja-hub-grid">
          <article className="maja-hub-card">
            <p className="maja-hub-kicker">Historia</p>
            <h2>Stulecie wojen i Kościuszko</h2>
            <p>Najpierw streszczenie całej lekcji, potem quiz z losowymi pytaniami.</p>
            <div className="maja-hub-links">
              <a className="maja-switch-link" href="/maja/historia/streszczenie">Streszczenie</a>
              <a className="maja-switch-link" href="/maja/historia">Quiz</a>
            </div>
          </article>

          <article className="maja-hub-card">
            <p className="maja-hub-kicker">Angielski</p>
            <h2>Słówka i zdania o sporcie</h2>
            <p>Najpierw streszczenie słówek i wzorów zdań, potem quiz utrwalający.</p>
            <div className="maja-hub-links">
              <a className="maja-switch-link" href="/maja/angielski/streszczenie">Streszczenie</a>
              <a className="maja-switch-link" href="/maja/angielski">Quiz</a>
            </div>
          </article>

          <article className="maja-hub-card">
            <p className="maja-hub-kicker">Angielski</p>
            <h2>Czasowniki nieregularne</h2>
            <p>Ćwicz wszystkie 36 czasowników: bezokolicznik, Past Simple, Past Participle i znaczenie po polsku.</p>
            <div className="maja-hub-links">
              <a className="maja-switch-link" href="/maja/angielski/czasowniki">Zacznij quiz</a>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
