import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12 bg-[#0a0a0b]">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="text-6xl sm:text-7xl mb-2">🏛️</div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
          Ne treba ti još jedan savet.
        </h1>

        <p className="text-base sm:text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
          Treba ti neko ko ume da sluša.
          <br />
          <span className="text-gray-500">I ko postavlja prava pitanja.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/chat"
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 text-base sm:text-lg px-6 py-3.5 rounded-2xl font-semibold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            Počni razgovor →
          </Link>
          <Link
            href="/login"
            className="border border-gray-700 text-gray-300 hover:bg-gray-800/50 text-base px-6 py-3.5 rounded-2xl font-medium transition-all active:scale-95"
          >
            Prijavi se
          </Link>
        </div>

        <div className="pt-6 space-y-1.5">
          <p className="text-gray-500 text-xs sm:text-sm">✦ 3 razgovora dnevno besplatno</p>
          <p className="text-gray-500 text-xs sm:text-sm">✦ Bez registracije za prvi utisak</p>
          <p className="text-gray-500 text-xs sm:text-sm">✦ Potpuno privatno</p>
        </div>

        <blockquote className="pt-6 mt-6 border-t border-gray-800/50">
          <p className="text-gray-500 italic text-sm sm:text-base leading-relaxed px-4">
            "Razgovarao sam sa AI-jem 20 minuta i shvatio da sam znao odgovor sve vreme."
          </p>
          <footer className="text-gray-600 text-xs mt-2">– neko kao ti, neki dan</footer>
        </blockquote>
      </div>

      <footer className="mt-auto pt-12 pb-4 text-gray-600 text-xs text-center">
        © {new Date().getFullYear()} PitajSokrata.com
      </footer>
    </main>
  );
}