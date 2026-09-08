"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ChatDrawer from "@/components/ChatDrawer";
import AuthBar, { AuthUser } from "@/components/AuthBar";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sky-200" />,
});

// Now points at the Node/Express gateway, not the Python service directly —
// the gateway owns auth, MongoDB logging, Bhashini translation, and proxies
// to the Python Agentic Platform internally.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapFeatures, setMapFeatures] = useState<any>(null);
  const [mapVersion, setMapVersion] = useState(0);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState<AuthUser | null>(null);

  // Check for an existing session cookie on load.
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const authRequest = useCallback(async (path: string, username: string, password: string) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Something went wrong";
    setUser(data.user);
    if (data.user?.role) setLanguage((l) => l); // profile language could seed this later
    return null;
  }, []);

  const handleLogin = useCallback((u: string, p: string) => authRequest("/api/auth/login", u, p), [authRequest]);
  const handleSignup = useCallback((u: string, p: string) => authRequest("/api/auth/signup", u, p), [authRequest]);
  const handleLogout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends the session cookie so logged-in chats get tied to the user
        body: JSON.stringify({ message: text, language }),
      });
      if (!res.ok) throw new Error(`Backend ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
      if (data.map_features?.features?.length) {
        setMapFeatures(data.map_features);
        setMapVersion((v) => v + 1);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ **Error:** ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapView mapFeatures={mapFeatures} refreshKey={mapVersion} />
      <ChatDrawer
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        language={language}
        onLanguageChange={setLanguage}
        user={user}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onLogout={handleLogout}
      />
    </main>
  );
}
