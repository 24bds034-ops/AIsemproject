import { useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MediBot } from "./MediBot";
import { ThemeToggle } from "./ThemeToggle";
import { MouseReactiveBackground } from "./MouseReactiveBackground";
import { LandingPage } from "./LandingPage";

export default function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  // Show landing page if chatbot is not started
  if (!showChatbot) {
    return <LandingPage onStart={() => setShowChatbot(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <MouseReactiveBackground />
      <div className="relative z-10 min-h-screen flex flex-col bg-gradient-to-br from-slate-50/95 to-white/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-sm">
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">💊</span>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              MediBot
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Authenticated>
              <SignOutButton />
            </Authenticated>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl mx-auto">
            <Content />
          </div>
        </main>
        <Toaster />
      </div>
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Authenticated>
        <MediBot />
      </Authenticated>
      
      <Unauthenticated>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">💊</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              MediBot
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-2 font-medium">Your Personal Medicine Assistant</p>
          <p className="text-slate-500 dark:text-slate-400">Get clear, simple, and safe information about any medicine</p>
        </div>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
