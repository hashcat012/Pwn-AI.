/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Chat from "./components/Chat";
import Starfield from "./components/Starfield";
import { Session } from "@supabase/supabase-js";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="bg-black min-h-screen font-sans relative overflow-x-hidden">
      {!session && <Starfield />}
      
      {session ? (
        <Chat />
      ) : showAuth ? (
        <div className="min-h-screen font-sans relative z-10">
          <button 
            onClick={() => setShowAuth(false)}
            className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors flex items-center gap-2 z-50"
          >
            ← Back
          </button>
          <Auth />
        </div>
      ) : (
        <LandingPage onGetStarted={() => setShowAuth(true)} />
      )}
    </div>
  );
}
