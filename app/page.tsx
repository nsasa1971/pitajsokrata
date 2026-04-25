import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0a0a0b]">
      <div className="max-w-2xl text-center space-y-8">
        <div className="text-7xl mb-4">🏛️</div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
          Ne treba ti još jedan savet.
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-lg mx-auto">
          Treba ti neko ko ume da sluša.
          <br />
          <span className="text-gray-500">I ko postavlja prava pitanja.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/chat" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 text-lg px-8 py-4 rounded-xl font-medium transition-all shadow-lg shadow-amber-500/20">
            Počni razgovor →
          </Link>
          <Link href="/login" className="border border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4 rounded-xl font-medium transition-all">
            Prijavi se
          </Link>
        </div>
        <div className="pt-8 space-y-2">
          <p className="text-gray-500 text-sm">✦ 3 razgovora dnevno besplatno</p>
          <p className="text-gray-500 text-sm">✦ Bez registracije za prvi utisak</p>
          <p className="text-gray-500 text-sm">✦ Potpuno privatno</p>
        </div>
        <blockquote className="pt-8 border-t border-gray-800">
          <p className="text-gray-400 italic text-lg">
            "Razgovarao sam sa AI-jem 20 minuta i shvatio da sam znao odgovor sve vreme."
          </p>
          <footer className="text-gray-600 text-sm mt-2">– neko kao ti, neki dan</footer>
        </blockquote>
      </div>
      <footer className="absolute bottom-4 text-gray-600 text-sm">
        © {new Date().getFullYear()} PitajSokrata.com
      </footer>
    </main>
  );
}