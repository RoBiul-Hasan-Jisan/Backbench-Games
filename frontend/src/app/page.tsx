import Link from "next/link";
import { ArrowRight, Sparkles, Users, Trophy, Zap } from "lucide-react";

export default function HomePage() {
    return (
        <main className="min-h-screen overflow-x-hidden bg-[#1a171f]">

            {/* ============================================================ */}
            {/* CLASSROOM — Chalkboard with nostalgic school details          */}
            {/* ============================================================ */}

            <section className="relative min-h-screen overflow-hidden px-4 py-20 sm:px-6 sm:py-28">

                {/* ——— Wall background (old painted wall) ——— */}
                <div className="absolute inset-0 bg-[#2c2833]" />
                <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        backgroundSize: "200px 200px",
                    }}
                />

                {/* ——— Wall scratches / marks ——— */}
                <div className="absolute left-[10%] top-[20%] h-px w-24 rotate-12 bg-white/5" />
                <div className="absolute right-[15%] top-[35%] h-px w-16 -rotate-6 bg-white/5" />
                <div className="absolute left-[5%] bottom-[40%] h-px w-32 rotate-45 bg-white/5" />

                {/* ——— Cursive alphabet banner (above the board, classic classroom strip) ——— */}
                <div className="absolute left-1/2 top-[0.5%] hidden w-[70%] -translate-x-1/2 items-center justify-between px-2 lg:flex">
                    {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter, i) => (
                        <span
                            key={i}
                            className="font-serif text-[11px] italic text-yellow-100/15"
                            style={{ transform: `rotate(${(i % 2 === 0 ? -4 : 4)}deg)` }}
                        >
                            {letter}
                        </span>
                    ))}
                </div>

                {/* ——— Corkboard (pinned notices, upper-left of wall) ——— */}
                <div className="absolute left-[1%] top-[6%] hidden h-40 w-32 -rotate-2 rounded-sm bg-[#8a6b4a] shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-4 ring-[#5a3f28] xl:block">
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                    />
                    {/* Pinned index card */}
                    <div className="absolute left-2 top-3 h-10 w-16 -rotate-3 bg-[#f4ecd8] shadow-md">
                        <div className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-red-500/70" />
                        <div className="absolute inset-x-1.5 top-3 space-y-1">
                            <div className="h-px bg-[#3d2e1e]/20" />
                            <div className="h-px w-3/4 bg-[#3d2e1e]/20" />
                        </div>
                    </div>
                    {/* Pinned flyer */}
                    <div className="absolute right-1.5 top-9 h-12 w-14 rotate-2 bg-[#eee2c4] shadow-md">
                        <div className="absolute left-1/2 top-1 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500/60" />
                        <div className="absolute left-1/2 top-3 -translate-x-1/2 text-[6px] font-bold uppercase tracking-widest text-[#3d2e1e]/40">
                            Recess
                        </div>
                        <div className="absolute left-1/2 top-5 -translate-x-1/2 text-[5px] text-[#3d2e1e]/30">
                            2:45 PM
                        </div>
                    </div>
                    {/* Gold star sticker */}
                    <div className="absolute bottom-2 left-3 rotate-6 text-lg text-yellow-300/70 drop-shadow-sm">
                        ★
                    </div>
                    {/* Photo pinned */}
                    <div className="absolute bottom-3 right-2 h-9 w-11 -rotate-6 bg-[#d9c9a3] p-0.5 shadow-md">
                        <div className="h-full w-full bg-[#3a3428]/40" />
                        <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-green-600/60" />
                    </div>
                </div>

                {/* ——— Rolled world map (upper-right of wall) ——— */}
                <div className="absolute right-[2%] top-[8%] hidden xl:block">
                    <div className="h-32 w-6 rounded-t-sm bg-linear-to-b from-[#c9b896] to-[#a89370] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                        <div className="absolute -left-1 top-0 h-2 w-8 rounded-full bg-[#8a7355]" />
                        <div className="absolute -left-1 bottom-0 h-2 w-8 rounded-full bg-[#8a7355]" />
                    </div>
                </div>

                {/* ——— Chalkboard (main board) ——— */}
                <div className="absolute inset-[3%] rounded-lg border-12 border-[#3d2e1e] shadow-[0_20px_80px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(0,0,0,0.6)] md:inset-[4%]">
                    {/* Inner board surface */}
                    <div className="relative h-full w-full overflow-hidden rounded-sm bg-[#1a2a1f]">
                        {/* Green/black chalkboard gradient */}
                        <div className="absolute inset-0 bg-linear-to-br from-[#1e2f22] via-[#162218] to-[#0f1a12]" />

                        {/* Chalk dust texture overlay */}
                        <div
                            className="absolute inset-0 opacity-[0.15]"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                backgroundSize: "256px 256px",
                            }}
                        />

                        {/* Eraser smudge marks */}
                        <div className="absolute bottom-[30%] right-[20%] h-32 w-48 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute top-[25%] left-[40%] h-24 w-40 rounded-full bg-white/5 blur-2xl" />
                        <div className="absolute bottom-[10%] left-[10%] h-20 w-36 rounded-full bg-white/5 blur-xl" />

                        {/* ——— CHALK CONTENT (on the board) ——— */}

                        {/* Left: class notes */}
                        <div className="absolute left-6 top-8 font-mono text-sm leading-relaxed text-white/40 md:left-10 md:top-12 md:text-base">
                            <div className="border-l-2 border-yellow-300/30 pl-3 md:pl-4">
                                <div className="text-[10px] uppercase tracking-[0.3em] text-yellow-200/40 md:text-xs">
                                    Today's agenda
                                </div>
                                <div className="mt-2 space-y-1 text-white/50">
                                    <div>✓ Think</div>
                                    <div className="text-yellow-200/40">✓ Plan</div>
                                    <div>✓ Play</div>
                                </div>
                            </div>
                            <div className="mt-4 border-l-2 border-white/10 pl-3 text-xs text-white/25 md:pl-4">
                                <div>No homework.</div>
                                <div className="text-yellow-200/30">Just games.</div>
                            </div>
                        </div>

                        {/* Center top: big chalk title */}
                        <div className="absolute left-1/2 top-6 -translate-x-1/2 -rotate-2 text-6xl font-black tracking-[0.15em] text-white/10 select-none md:top-8 md:text-8xl lg:text-9xl">
                            GAME ON!
                        </div>

                        {/* Right: tic-tac-toe */}
                        <div className="absolute right-6 top-8 text-right md:right-10 md:top-12">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-yellow-200/30 md:text-xs">
                                Last game
                            </div>
                            <div className="mt-2 font-mono text-2xl leading-[1.3] tracking-wider text-white/30 md:text-3xl lg:text-4xl">
                                <span className="text-yellow-200/40">O</span> X O
                                <br />
                                X <span className="text-yellow-200/40">O</span> X
                                <br />
                                O X <span className="text-yellow-200/40">O</span>
                            </div>
                            <div className="mt-1 text-[10px] text-white/15 font-mono md:text-xs">
                                — winner: O
                            </div>
                        </div>

                        {/* Chalk doodles */}
                        <div className="absolute bottom-16 left-8 hidden rotate-12 text-4xl text-white/10 select-none md:block lg:text-5xl">
                            ★
                        </div>
                        <div className="absolute bottom-20 right-10 hidden -rotate-12 text-5xl text-yellow-200/10 select-none md:block lg:text-6xl">
                            ⚡
                        </div>
                        <div className="absolute left-[30%] top-[55%] hidden rotate-12 text-6xl text-white/5 select-none md:block">
                            ?
                        </div>
                        <div className="absolute right-[25%] bottom-20 hidden -rotate-6 text-5xl text-green-400/10 select-none md:block">
                            ✓
                        </div>

                        {/* Chalk hopscotch grid, lower-left corner of board */}
                        <div className="absolute bottom-6 left-[4%] hidden -rotate-3 select-none font-mono text-[10px] leading-[1.1] text-white/10 lg:block">
                            <div className="flex justify-center">7</div>
                            <div className="flex justify-center gap-1">
                                <span>5</span><span>6</span>
                            </div>
                            <div className="flex justify-center">4</div>
                            <div className="flex justify-center gap-1">
                                <span>2</span><span>3</span>
                            </div>
                            <div className="flex justify-center">1</div>
                        </div>

                        {/* Chalk "teacher wrote this" */}
                        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-[8px] uppercase tracking-[0.5em] text-white/10 select-none md:block">
                            • • • • • • • • • • • • • • • • • • • •
                        </div>

                        {/* ——— Floating chalk dust particles ——— */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(30)].map((_, i) => {
                                const size = 2 + Math.random() * 5;
                                const x = Math.random() * 100;
                                const y = Math.random() * 100;
                                const delay = Math.random() * 10;
                                const duration = 8 + Math.random() * 12;
                                return (
                                    <div
                                        key={i}
                                        className="absolute rounded-full bg-white/10 animate-float"
                                        style={{
                                            width: size,
                                            height: size,
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            animationDelay: `${delay}s`,
                                            animationDuration: `${duration}s`,
                                            opacity: 0.1 + Math.random() * 0.2,
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* ——— Paper airplane, mid-flight across the board ——— */}
                        <div className="absolute right-[8%] top-[18%] hidden rotate-18 text-white/15 md:block">
                            <svg width="46" height="46" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2 12L22 2L14 22L11 14L2 12Z" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.5" />
                                <path d="M11 14L14 22L11 14Z" />
                            </svg>
                        </div>
                        <div className="absolute right-[13%] top-[15%] hidden h-px w-10 rotate-18 bg-white/10 md:block" />

                        {/* ——— Chalk glow ——— */}
                        <div className="absolute left-1/2 top-1/2 h-100 w-100 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/6 blur-[150px]" />
                        <div className="absolute left-1/4 top-1/3 h-75 w-75 -translate-x-1/2 rounded-full bg-purple-400/4 blur-[120px]" />

                    </div>
                </div>

                {/* ——— Torn notebook-paper corner, peeking from behind the board ——— */}
                <div className="absolute bottom-[13%] left-[1.5%] hidden h-24 w-20 -rotate-6 bg-[#f4f1e6] shadow-[0_10px_20px_rgba(0,0,0,0.4)] lg:block">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-red-400/40" />
                    <div className="absolute inset-x-4 top-3 space-y-2">
                        <div className="h-px bg-blue-400/20" />
                        <div className="h-px bg-blue-400/20" />
                        <div className="h-px w-2/3 bg-blue-400/20" />
                    </div>
                </div>

                {/* ——— Chalk Tray (wooden ledge) ——— */}
                <div className="absolute bottom-[3%] left-1/2 h-3 w-[60%] -translate-x-1/2 rounded-sm bg-[#5a3f28] shadow-[0_4px_20px_rgba(0,0,0,0.6)] md:h-4 md:w-[50%]">
                    <div className="absolute -top-1 left-1/2 h-1 w-[70%] -translate-x-1/2 rounded-full bg-[#6d4f33]" />
                    {/* Chalk pieces on tray */}
                    <div className="absolute -top-3 left-[15%] h-5 w-1.5 rounded-sm bg-white/30 shadow-sm rotate-6" />
                    <div className="absolute -top-3 left-[25%] h-4 w-1.5 rounded-sm bg-yellow-200/30 shadow-sm -rotate-3" />
                    <div className="absolute -top-3 left-[35%] h-5 w-1.5 rounded-sm bg-blue-300/20 shadow-sm rotate-12" />
                    <div className="absolute -top-3 left-[55%] h-4 w-1.5 rounded-sm bg-white/25 shadow-sm -rotate-6" />
                    <div className="absolute -top-3 left-[70%] h-5 w-1.5 rounded-sm bg-green-300/20 shadow-sm rotate-6" />
                    {/* Eraser on tray */}
                    <div className="absolute -top-5 right-[8%] h-4 w-10 rounded-sm bg-[#2a1f14] shadow-md ring-1 ring-white/10 md:h-5 md:w-14" />
                    {/* Wooden ruler, leaning on the tray */}
                    <div className="absolute -top-4 left-[45%] hidden h-6 w-1 rotate-70 bg-linear-to-b from-[#c9a86a]/60 to-[#a8823f]/50 md:block">
                        <div className="absolute inset-y-0 left-0 w-px bg-[#3d2e1e]/40" />
                    </div>
                    {/* Yellow pencil, resting on tray */}
                    <div className="absolute -top-2.5 left-[8%] hidden h-1 w-9 -rotate-3 rounded-full bg-yellow-500/40 shadow-sm md:block">
                        <div className="absolute -left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#e8b98a]/50" />
                        <div className="absolute -right-0.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#3d2e1e]/50" />
                    </div>
                </div>

                {/* ——— Teacher's Desk (decorative bottom element) ——— */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#3d2e1e] shadow-[0_-4px_30px_rgba(0,0,0,0.5)] md:h-16">
                    <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-white/5" />
                    {/* Desk drawer handles */}
                    <div className="absolute left-[15%] top-1/2 h-1 w-8 -translate-y-1/2 rounded-sm bg-[#5a3f28] shadow-inner md:w-12" />
                    <div className="absolute left-[40%] top-1/2 h-1 w-8 -translate-y-1/2 rounded-sm bg-[#5a3f28] shadow-inner md:w-12" />
                    <div className="absolute left-[65%] top-1/2 h-1 w-8 -translate-y-1/2 rounded-sm bg-[#5a3f28] shadow-inner md:w-12" />
                    {/* A little red apple, resting on the front desk edge */}
                    <div className="absolute -top-3 right-[6%] hidden md:block">
                        <div className="relative h-4 w-4 rounded-full bg-linear-to-br from-red-500/50 to-red-700/50 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                            <div className="absolute -top-1.5 left-1/2 h-2 w-0.5 -translate-x-1/2 rotate-12 rounded-full bg-[#5a3f28]/70" />
                            <div className="absolute -top-1 left-[55%] h-1.5 w-1 rotate-45 rounded-full bg-green-600/40" />
                        </div>
                    </div>
                </div>

                {/* ——— Clock on wall (above board) ——— */}
                <div className="absolute left-1/2 top-[1%] hidden -translate-x-1/2 text-white/10 md:block">
                    <div className="relative h-14 w-14 rounded-full border-2 border-white/10 md:h-16 md:w-16">
                        <div className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rotate-12 origin-bottom bg-white/10" />
                        <div className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-12 origin-bottom bg-white/10" />
                        <div className="absolute left-1/2 top-1/2 h-0.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />
                        {/* Hour marks */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                            <div
                                key={deg}
                                className="absolute left-1/2 top-0 h-1 w-px -translate-x-1/2 bg-white/5"
                                style={{ transform: `rotate(${deg}deg)`, transformOrigin: "bottom center" }}
                            />
                        ))}
                    </div>
                </div>

                {/* ——— Hero Content (centered over board) ——— */}
                <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
                    <div className="text-center">

                       
                      

                        {/* Main Heading — chalkboard style */}
                        <h1 className="text-4xl font-black leading-[1.1] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.8)] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                            Pick a Desk.
                            <br />
                            <span className="relative inline-block">
                                Start a Match.
                                <span className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-linear-to-r from-yellow-200/30 via-yellow-200/10 to-transparent" />
                            </span>
                        </h1>

                        {/* Subtext — chalky */}
                        <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-300/60 sm:text-base md:text-lg">
                            The games you played when the teacher stepped out — now online,
                            with a room code you can text a friend.
                        </p>

                        {/* Stats — chalk style */}
                        <div className="mx-auto mt-8 flex max-w-sm flex-wrap items-center justify-center gap-4 text-xs text-white/30 sm:gap-6 md:text-sm">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-yellow-200/20" />
                                <span>2–8 players</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy size={16} className="text-yellow-200/20" />
                                <span>Instant matches</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-yellow-200/20" />
                                <span>No sign-up</span>
                            </div>
                        </div>

                        {/* Buttons — chalkboard friendly */}
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">

                            <Link
                                href="/games"
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-indigo-500 px-7 py-3.5 font-semibold text-white shadow-[0_8px_30px_rgba(99,102,241,0.2)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(99,102,241,0.3)] active:scale-[0.97]"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Play Now
                                    <ArrowRight
                                        size={18}
                                        className="transition-transform duration-300 group-hover:translate-x-1"
                                    />
                                </span>
                                <span className="absolute inset-0 -translate-y-full bg-linear-to-t from-white/10 to-transparent transition-transform duration-500 group-hover:translate-y-0" />
                            </Link>

                            <Link
                                href="/games"
                                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 font-semibold text-white/60 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white/80"
                            >
                                Browse Games
                                <span className="text-white/20 transition-colors group-hover:text-white/40">→</span>
                            </Link>

                        </div>

                        {/* Chalk footer note */}
                        <div className="mt-12 font-mono text-[8px] uppercase tracking-[0.4em] text-white/10 md:text-[10px]">
                            <span className="inline-block border-t border-white/5 pt-4">
                                no teachers allowed • detention-free zone
                            </span>
                        </div>

                    </div>
                </div>

                {/* ——— Bottom chalk line (on board) ——— */}
                <div className="absolute bottom-[12%] left-1/2 hidden h-px w-[60%] -translate-x-1/2 bg-white/5 md:block" />

                {/* ——— Animated chalk float ——— */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes float {
                            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.08; }
                            25% { transform: translate(6px, -10px) scale(1.3); opacity: 0.2; }
                            50% { transform: translate(-4px, 6px) scale(0.8); opacity: 0.12; }
                            75% { transform: translate(10px, 4px) scale(1.1); opacity: 0.18; }
                        }
                        .animate-float {
                            animation: float ease-in-out infinite;
                        }
                    `
                }} />

            </section>
        </main>
    );
}