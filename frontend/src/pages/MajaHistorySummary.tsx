import { useEffect } from 'react'

const QUIZ_VERSION = 3

const HISTORY_SUMMARY = [
  {
    title: '1) Lekcja 2: XVII wiek – stulecie wojen',
    points: [
      'Po „złotym wieku” (XVI w.) sytuacja Rzeczypospolitej pogorszyła się.',
      'W XVII w. Polska toczyła wojny ze Szwecją, Rosją i Turcją.',
      'Ten okres nazwano stuleciem wojen, bo konflikty były długie i wyniszczające.',
    ],
  },
  {
    title: '2) Wojny ze Szwecją i potop szwedzki',
    points: [
      '1600-1611: wojna o wschodnie wybrzeża Bałtyku (bez rozstrzygnięcia).',
      '1605: bitwa pod Kircholmem – zwycięstwo nad liczniejszą armią szwedzką.',
      '1655-1660: potop szwedzki (wojska szwedzkie szybko zajęły dużą część kraju).',
      'Stefan Czarniecki prowadził wojnę podjazdową (ataki z zaskoczenia).',
      '1660: pokój w Oliwie – koniec walk ze Szwecją, ale Polska utraciła część ziem.',
    ],
  },
  {
    title: '3) Obrona Jasnej Góry i wojny z Turcją',
    points: [
      '1655: obroną Jasnej Góry dowodził Augustyn Kordecki.',
      'Obrona miała wielkie znaczenie moralne i zmobilizowała społeczeństwo.',
      '1683: odsiecz wiedeńska – Jan III Sobieski pokonał Turków pod Wiedniem.',
      'Wiktoria wiedeńska zatrzymała pochód Turków w Europie.',
      'Słowniczek: odsiecz = pomoc zbrojna, wiktoria = zwycięstwo, wielki wezyr = naczelny dowódca turecki.',
    ],
  },
  {
    title: '4) Husaria i skutki wojen XVII wieku',
    points: [
      'Husaria: główna broń to kopia (nawet do 5 m), do tego m.in. szabla i pistolety.',
      'Skutki wojen: zniszczenia miast i wsi, głód, epidemie, spadek liczby ludności.',
      'Rzeczpospolita utraciła część ziem i osłabiła swoją pozycję w Europie.',
      'Najeźdźcy wywozili dzieła sztuki i księgozbiory (m.in. zbiory Kopernika).',
      'Jednocześnie rosła siła sąsiadów: Prus, Rosji i Austrii.',
    ],
  },
  {
    title: '5) Lekcja 3: Kryzys Rzeczypospolitej i rozbiory',
    points: [
      'XVIII wiek to czas kryzysu i słabości państwa po wcześniejszych wojnach.',
      'Sąsiedzi (Rosja, Prusy, Austria) ingerowali w sprawy Polski.',
      '1772: I rozbiór Polski.',
      '1791: Konstytucja 3 maja (próba ratowania państwa).',
      '1793: II rozbiór Polski.',
    ],
  },
  {
    title: '6) Powstanie kościuszkowskie (1794)',
    points: [
      'Była to ostatnia próba obrony niepodległości Rzeczypospolitej.',
      'Na czele stanął Tadeusz Kościuszko (uroczysta przysięga w Krakowie).',
      'Ważna wygrana: bitwa pod Racławicami, duża rola kosynierów.',
      'Wojciech Bartosz Głowacki zasłynął odwagą pod Racławicami.',
      'Po klęsce pod Maciejowicami Kościuszko dostał się do niewoli.',
    ],
  },
  {
    title: '7) Upadek powstania i najważniejsze skutki',
    points: [
      'Po upadku powstania Rosja, Prusy i Austria dokonały III rozbioru (1795).',
      'Król Stanisław August Poniatowski abdykował.',
      'Polska zniknęła z mapy Europy na 123 lata.',
      'Współcześnie po dawnej Rzeczypospolitej ślady widać m.in. na Litwie, Łotwie, Białorusi i Ukrainie.',
      'Panorama Racławicka we Wrocławiu upamiętnia zwycięstwo pod Racławicami.',
    ],
  },
]

export function MajaHistorySummary() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Maja | Historia - streszczenie'
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
          <p className="maja-kicker">Historia | Rozdział III</p>
          <h1 className="maja-title">Streszczenie lekcji</h1>
          <p className="maja-sub">Najpierw nauka, potem quiz.</p>
          <div className="maja-switch">
            <a className="maja-switch-link" href="/maja/historia">Quiz historia</a>
            <a className="maja-switch-link is-active" href="/maja/historia/streszczenie">Streszczenie historia</a>
            <a className="maja-switch-link" href="/maja/angielski">Quiz angielski</a>
            <a className="maja-switch-link" href="/maja/angielski/streszczenie">Streszczenie angielski</a>
          </div>
        </header>

        <section className="maja-card maja-study">
          <div className="maja-study-head">
            <h2>Cała lekcja w skrócie</h2>
            <p>Przejdź po blokach i wróć do quizu, by sprawdzić wiedzę.</p>
          </div>

          <div className="maja-study-grid">
            {HISTORY_SUMMARY.map((block) => (
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
