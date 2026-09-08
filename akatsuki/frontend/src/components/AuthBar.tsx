"use client";

import { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export default function AuthBar({
  user,
  onLogin,
  onSignup,
  onLogout,
}: {
  user: AuthUser | null;
  onLogin: (username: string, password: string) => Promise<string | null>;
  onSignup: (username: string, password: string) => Promise<string | null>;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span>
          Signed in as <strong>{user.username}</strong>
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
        >
          <LogOut size={12} /> Log out
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fn = mode === "login" ? onLogin : onSignup;
    const err = await fn(username, password);
    setBusy(false);
    if (err) setError(err);
    else {
      setOpen(false);
      setUsername("");
      setPassword("");
    }
  };

  return (
    <div className="relative text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
      >
        <LogIn size={12} /> Sign in
      </button>
      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 top-8 z-10 w-56 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="flex gap-2 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={mode === "login" ? "text-blue-600" : "text-slate-400"}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={mode === "signup" ? "text-blue-600" : "text-slate-400"}
            >
              Sign up
            </button>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-md border border-slate-200 px-2 py-1"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-md border border-slate-200 px-2 py-1"
            required
          />
          {error && <p className="text-[11px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-white disabled:opacity-50"
          >
            <UserPlus size={12} /> {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}
