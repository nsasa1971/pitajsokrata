"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setMessage(error.message);
        setMessageType("error");
      } else {
        setMessage("Nalog je kreiran! Proveri email za potvrdu.");
        setMessageType("success");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        setMessageType("error");
      } else {
        router.push("/chat");
        router.refresh();
      }
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0b]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏛️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">PitajSokrata.com</h1>
          <p className="text-gray-400 mt-2">
            {isRegister ? "Registruj se i sačuvaj razgovore" : "Prijavi se da vidiš istoriju"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#0d0d0f] border border-gray-800/50 rounded-2xl p-6">
          <input
            type="email"
            placeholder="Email adresa"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#1a1a1e] border border-gray-700/50 text-gray-100 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all"
          />
          <input
            type="password"
            placeholder="Lozinka (min 6 karaktera)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-[#1a1a1e] border border-gray-700/50 text-gray-100 rounded-xl px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 transition-all"
          />

          {message && (
            <p className={`text-sm text-center ${messageType === "error" ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl px-4 py-3 font-medium transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {loading ? "Sačekaj..." : isRegister ? "Registruj se" : "Prijavi se"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {isRegister ? "Već imaš nalog?" : "Nemaš nalog?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-amber-400 hover:underline"
          >
            {isRegister ? "Prijavi se" : "Registruj se"}
          </button>
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Nastavi bez prijave →
        </button>
      </div>
    </main>
  );
}