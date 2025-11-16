import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";

interface ChatSidebarProps {
  currentConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations"> | null) => void;
  onNewChat: () => Promise<void>;
}

export function ChatSidebar({ currentConversationId, onSelectConversation, onNewChat }: ChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const conversations = useQuery(api.medibot.getAllConversations);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const deleteConversation = useMutation(api.medibot.deleteConversation);
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();

  const handleDelete = async (e: React.MouseEvent, conversationId: Id<"conversations">) => {
    e.stopPropagation();
    await deleteConversation({ conversationId });
    if (currentConversationId === conversationId) {
      onSelectConversation(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getUserInitials = () => {
    if (!loggedInUser) return "U";
    const name = loggedInUser.name || loggedInUser.email || "User";
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-[110] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-64 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                await onNewChat();
              } catch (error) {
                console.error("Error in new chat:", error);
                toast.error("Failed to create new chat");
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg transition-colors font-medium cursor-pointer"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="px-2 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Recent
          </div>
          {conversations === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => {
                    onSelectConversation(conv._id);
                    setIsOpen(false);
                  }}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conv._id
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {conv.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(conv.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conv._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Account Section */}
        {isAuthenticated && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {loggedInUser?.name || loggedInUser?.email || "User"}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {loggedInUser?.email}
                </div>
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  await signOut();
                  toast.success("Signed out successfully");
                } catch (error) {
                  console.error("Error signing out:", error);
                  toast.error("Failed to sign out");
                }
              }}
              className="w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              type="button"
            >
              Sign out
            </button>
          </div>
        )}

        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[105]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </>
  );
}

