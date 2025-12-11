"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRegister, ApiError } from "@/lib/api";

type RoleOption = "player" | "team";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleOption>("player");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await apiRegister({ email, password, role });

      if (typeof window !== "undefined") {
        window.localStorage.setItem("accessToken", res.accessToken);
        window.localStorage.setItem("currentUser", JSON.stringify(res.user));
        window.dispatchEvent(new Event("auth-changed"));
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Registrierung fehlgeschlagen.");
      }
      console.error("Register error", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-surface/80 p-6 shadow-lg"
      >
        <h1 className="text-lg font-semibold text-white">Account erstellen</h1>

        {error && (
          <p className="rounded border border-red-500/60 bg-red-950/40 p-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-xs text-gray-300">E-Mail</label>
          <input
            type="email"
            className="w-full rounded bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-300">Passwort</label>
          <input
            type="password"
            className="w-full rounded bg-black/40 px-3 py-2 text-sm text-white outline-none ring-1 ring-border/60 focus:ring-[#00eaff]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-gray-300">Rolle</label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setRole("player")}
              className={`flex-1 rounded-full border px-3 py-2 ${
                role === "player"
                  ? "border-[#00eaff] text-[#00eaff]"
                  : "border-border text-gray-300 hover:border-[#00eaff]/60"
              }`}
            >
              Spieler
            </button>
            <button
              type="button"
              onClick={() => setRole("team")}
              className={`flex-1 rounded-full border px-3 py-2 ${
                role === "team"
                  ? "border-[#00eaff] text-[#00eaff]"
                  : "border-border text-gray-300 hover:border-[#00eaff]/60"
              }`}
            >
              Team / Orga
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-full bg-[#00eaff] px-4 py-2 text-sm font-semibold text-black shadow-[0_0_12px_#00eaff] transition hover:shadow-[0_0_20px_#00eaff] disabled:opacity-60"
        >
          {submitting ? "Registriere..." : "Registrieren"}
        </button>
      </form>
    </main>
  );
}
