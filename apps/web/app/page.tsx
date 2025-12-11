import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Esport Matcher
        </h1>
        <p className="mt-4 max-w-xl text-center text-gray-400">
          Finde dein nächstes Team. Verbinde Semi-Competitive Spieler mit
          ambitionierten Teams & Pro-Organisationen – strukturiert, fokussiert,
          ready für den nächsten Schritt.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/register"
            className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-black shadow-soft-neon transition hover:bg-accent/80"
          >
            Account erstellen
          </Link>
          <Link
            href="/auth/login"
            className="rounded-2xl border border-accent px-6 py-3 text-sm font-semibold text-accent hover:bg-accent/10"
          >
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white">
            Semi-Competitive Fokus
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Strukturiere den Weg vom ambitionierten Ranked-Grinder zum
            organisierten Team mit klaren Rollen & Trainingszeiten.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white">Pro-Bereich</h2>
          <p className="mt-2 text-sm text-gray-400">
            Separater Bereich für verifizierte Spieler & Organisationen – finde
            Ersatzspieler, Academy-Roster oder neue Lineups.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-white">
            Listen & Matching
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Präzise Filter und später personalisierte Matches – statt Swipes
            und Zufall.
          </p>
        </div>
      </section>
    </main>
  );
}
