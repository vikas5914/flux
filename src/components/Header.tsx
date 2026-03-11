import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, LogIn, LogOut } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const [pendingAuth, setPendingAuth] = useState<"signin" | "signout" | null>(null);

  const handleSignIn = async () => {
    if (pendingAuth) return;
    setPendingAuth("signin");
    try {
      await signIn("google");
    } finally {
      setPendingAuth(null);
    }
  };

  const handleSignOut = async () => {
    if (pendingAuth) return;
    setPendingAuth("signout");
    try {
      await signOut();
    } finally {
      setPendingAuth(null);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-[#1f1f1f]">
      <div className="max-w-6xl mx-auto px-6 h-full grid grid-cols-[1fr_auto_1fr] items-center">
        <Link to="/" className="flex items-center gap-2 justify-self-start">
          <Play aria-hidden="true" className="w-5 h-5 text-[#f6821f] fill-[#f6821f]" />
          <span className="text-sm font-semibold tracking-tight">Flux</span>
        </Link>

        {title ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-white truncate">{title}</span>
            {subtitle && <span className="text-xs text-[#71717a] shrink-0">{subtitle}</span>}
          </div>
        ) : (
          <div />
        )}

        <nav className="flex items-center gap-4 justify-self-end">
          {!isLoading &&
            (isAuthenticated ? (
              <button
                onClick={() => void handleSignOut()}
                disabled={pendingAuth !== null}
                aria-busy={pendingAuth === "signout"}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#151515] border border-[#2a2a2a] text-[#a1a1aa] hover:border-[#3a3a3a] hover:text-white transition-colors disabled:opacity-70 disabled:cursor-wait disabled:hover:border-[#2a2a2a] disabled:hover:text-[#a1a1aa]"
                title="Sign out"
              >
                {pendingAuth === "signout" ? (
                  <span className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {pendingAuth === "signout" ? "Signing out..." : "Sign out"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => void handleSignIn()}
                disabled={pendingAuth !== null}
                aria-busy={pendingAuth === "signin"}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#151515] border border-[#f6821f] text-[#f6821f] hover:bg-[#f6821f]/10 transition-colors disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-transparent"
                title="Sign in to sync across devices"
              >
                {pendingAuth === "signin" ? (
                  <span className="w-3.5 h-3.5 rounded-full border border-current border-t-transparent animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {pendingAuth === "signin" ? "Signing in..." : "Sign in"}
                </span>
              </button>
            ))}
        </nav>
      </div>
    </header>
  );
}
