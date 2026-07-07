import Link from "next/link";
import { Pencil, ArrowRight, Swords } from "lucide-react";
import { GAMES } from "@/lib/games"; // adjust import path if needed

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-notebook px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center gap-3">
          <Pencil size={20} className="text-wood" />
          <h2 className="text-2xl font-semibold text-chalkboard-dark">
            Choose a game
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {GAMES.map((game) => (
            <div
              key={game.id}
              className="group relative rounded-xl border border-paper-line bg-white/70 p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-chalkboard-dark">
                  {game.name}
                </h3>
                {!game.live && (
                  <span className="rounded-full bg-wood/10 px-2 py-0.5 text-xs font-medium text-wood">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-chalkboard-dark/60">{game.tagline}</p>
              <p className="mt-3 font-mono text-xs text-chalkboard-dark/40">
                {game.time}
              </p>

              {game.live ? (
                <Link
                  href={`/play/${game.id}`}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-inkblue transition group-hover:gap-2"
                >
                  Play <ArrowRight size={14} />
                </Link>
              ) : (
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-chalkboard-dark/30">
                  <Swords size={14} /> Not yet playable
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}