import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MediBot } from "./MediBot";
import { ThemeToggle } from "./ThemeToggle";
import { MouseReactiveBackground } from "./MouseReactiveBackground";
import { LandingPage } from "./LandingPage";
import { ChatSidebar } from "./ChatSidebar";
import { ErrorBoundary } from "./ErrorBoundary";

export default function App() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<Id<"conversations"> | null>(null);
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Automatically show chatbot when user signs in
  useEffect(() => {
    if (showSignIn && isAuthenticated && !isLoading) {
      setShowChatbot(true);
    }
  }, [showSignIn, isAuthenticated, isLoading]);

  // Show landing page if chatbot is not started
  if (!showChatbot && !showSignIn) {
    return (
      <ErrorBoundary>
        <LandingPage onStart={() => setShowSignIn(true)} />
      </ErrorBoundary>
    );
  }

  // Show sign-in page after clicking "Start Now"
  if (showSignIn && !showChatbot) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col relative">
          <MouseReactiveBackground />
          <div className="relative z-[100] min-h-screen flex flex-col bg-gradient-to-br from-slate-50/95 to-white/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-sm">
            <div className="flex-1 flex flex-col relative z-[100] w-full">
              <header className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💊</span>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    MediBot
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 flex items-center justify-center p-4 relative z-[100] w-full">
                <div className="w-full max-w-md mx-auto">
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
                    <p className="text-slate-500 dark:text-slate-400">Sign in to get started</p>
                  </div>
                  <ErrorBoundary>
                    <SignInForm />
                  </ErrorBoundary>
                </div>
              </main>
            </div>
            <Toaster />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col relative">
        <MouseReactiveBackground />
        <div className="relative z-[100] min-h-screen flex flex-col bg-gradient-to-br from-slate-50/95 to-white/95 dark:from-slate-900/95 dark:to-slate-800/95 backdrop-blur-sm">
          <Authenticated>
            <AppWithSidebar 
              currentConversationId={currentConversationId}
              setCurrentConversationId={setCurrentConversationId}
            />
          </Authenticated>
          <Unauthenticated>
            <div className="flex-1 flex flex-col relative z-[100] w-full">
              <header className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💊</span>
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    MediBot
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 flex items-center justify-center p-4 relative z-[100] w-full">
                <div className="w-full max-w-4xl mx-auto">
                  <Content conversationId={null} setCurrentConversationId={undefined} />
                </div>
              </main>
            </div>
          </Unauthenticated>
          <Toaster />
        </div>
      </div>
    </ErrorBoundary>
  );
}

interface AppWithSidebarProps {
  currentConversationId: Id<"conversations"> | null;
  setCurrentConversationId: (id: Id<"conversations"> | null) => void;
}

function AppWithSidebar({ currentConversationId, setCurrentConversationId }: AppWithSidebarProps) {
  const createConversation = useMutation(api.medibot.createConversation);
  const conversations = useQuery(api.medibot.getAllConversations);

  // Auto-select most recent conversation on load
  useEffect(() => {
    try {
      if (conversations && conversations.length > 0 && !currentConversationId) {
        setCurrentConversationId(conversations[0]._id);
      }
    } catch (error) {
      console.error("Error selecting conversation:", error);
    }
  }, [conversations, currentConversationId, setCurrentConversationId]);

  const handleNewChat = async () => {
    try {
      const newId = await createConversation({ title: "New Chat" });
      setCurrentConversationId(newId);
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error; // Re-throw to let ChatSidebar handle the toast
    }
  };

  const handleSelectConversation = (id: Id<"conversations"> | null) => {
    setCurrentConversationId(id);
  };

  return (
    <div className="flex flex-1 min-h-screen relative z-[100] w-full">
      <ChatSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
      />
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen relative z-[100] w-full">
        <header className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">💊</span>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              MediBot
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 relative z-[100] w-full">
          <div className="w-full max-w-4xl mx-auto">
            <Content conversationId={currentConversationId} setCurrentConversationId={setCurrentConversationId} />
          </div>
        </main>
      </div>
    </div>
  );
}

interface ContentProps {
  conversationId: Id<"conversations"> | null;
  setCurrentConversationId?: (id: Id<"conversations"> | null) => void;
}

function Content({ conversationId, setCurrentConversationId }: ContentProps) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  return (
    <div className="flex flex-col gap-8 w-full min-h-[400px]">
      {loggedInUser === undefined ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <Authenticated>
            <ErrorBoundary>
              <MediBot 
                conversationId={conversationId} 
                onConversationChange={setCurrentConversationId}
              />
            </ErrorBoundary>
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
              <ErrorBoundary>
                <SignInForm />
              </ErrorBoundary>
            </div>
          </Unauthenticated>
        </>
      )}
    </div>
  );
}
