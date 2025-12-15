"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CurrentUser = {
  userId: string;
  email: string;
  role: string;
};

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  const readUserFromStorage = () => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("em_auth");
    if (!stored) {
      setUser(null);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setUser(parsed);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    // Initial lesen
    readUserFromStorage();

    // Auf custom Event hören
    const handler = () => {
      readUserFromStorage();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-changed", handler);
      window.addEventListener("storage", handler); // für Multi-Tab
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-changed", handler);
        window.removeEventListener("storage", handler);
      }
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("em_auth");
      window.dispatchEvent(new Event("auth-changed"));
    }
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand / Logo → Landingpage "/" */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#00eaff] shadow-[0_0_12px_#00eaff]" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-100">
              ESPORT MATCHER
            </span>
          </Link>
        </div>

        {/* Haupt-Navigation */}
        <nav className="hidden items-center gap-4 text-xs text-gray-300 sm:flex">
          <Link
            href="/dashboard"
            className={classNames(
              "px-2 py-1 transition",
              isActive("/dashboard")
                ? "text-[#00eaff] border-b border-[#00eaff]"
                : "hover:text-white"
            )}
          >
            Dashboard
          </Link>

          {/* ✅ neu: Anfragen */}
          <Link
            href="/dashboard/requests"
            className={classNames(
              "px-2 py-1 transition",
              isActive("/dashboard/requests")
                ? "text-[#00eaff] border-b border-[#00eaff]"
                : "hover:text-white"
            )}
          >
            Anfragen
          </Link>

          <Link
            href="/dashboard/chats"
            className={classNames(
              "px-2 py-1 transition",
              isActive("/dashboard/chats")
                ? "text-[#00eaff] border-b border-[#00eaff]"
                : "hover:text-white"
            )}
          >
            Chats
          </Link>


          <Link
            href="/players"
            className={classNames(
              "px-2 py-1 transition",
              isActive("/players")
                ? "text-[#00eaff] border-b border-[#00eaff]"
                : "hover:text-white"
            )}
          >
            Spieler
          </Link>
          <Link
            href="/teams"
            className={classNames(
              "px-2 py-1 transition",
              isActive("/teams")
                ? "text-[#00eaff] border-b border-[#00eaff]"
                : "hover:text-white"
            )}
          >
            Teams
          </Link>
        </nav>

        {/* Rechts: Auth / User-Area */}
        <div className="flex items-center gap-3">
          {!user && (
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/auth/login"
                className="rounded-full border border-border px-3 py-1 text-gray-200 hover:border-[#00eaff] hover:text-[#00eaff] transition"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[#00eaff] px-4 py-1 text-xs font-semibold text-black shadow-[0_0_10px_#00eaff] hover:shadow-[0_0_18px_#00eaff] transition"
              >
                Registrieren
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden text-gray-400 sm:inline">
                {user.email} · {user.role}
              </span>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="hidden rounded-full border border-border px-3 py-1 text-gray-200 hover:border-[#00eaff] hover:text-[#00eaff] transition sm:inline"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#ff3366] px-3 py-1 text-xs font-semibold text-white shadow-[0_0_10px_#ff3366] hover:shadow-[0_0_18px_#ff3366] transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
