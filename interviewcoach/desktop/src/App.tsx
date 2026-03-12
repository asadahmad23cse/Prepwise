import { useState } from "react";
import { SessionWorkspace } from "./components/session/SessionWorkspace";
import { SessionSetup } from "./components/session/SessionSetup";
import { TitleBar } from "./components/layout/TitleBar";
import { useSessionStore } from "./stores/session-store";

function App() {
  const { status } = useSessionStore();

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-50">
      <TitleBar />
      <main className="flex-1 overflow-hidden">
        {status === "idle" || status === "setup" ? (
          <SessionSetup />
        ) : (
          <SessionWorkspace />
        )}
      </main>
    </div>
  );
}

export default App;
