import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, LogOut, MessageSquare, Plus, Settings, Search, ChevronLeft, Menu, MoreVertical, Pin, Trash2, Edit3 } from "lucide-react";
import { Copy01Icon, RedoIcon, CircleArrowUp02Icon, PanelLeftIcon } from "hugeicons-react";
import { supabase } from "../lib/supabase";

interface Message {
  role: "user" | "assistant";
  content: string;
  modelId?: string;
}

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
}

// History Item Component
const HistoryItem = ({ item, isActive, isPinned, onLoad, onDelete, onPin, onRename, capitalizeTitle }: any) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className={`group relative flex items-center rounded-xl transition-colors ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}>
      <button
        onClick={onLoad}
        className="flex-1 flex items-center gap-3 px-4 py-3 text-left min-w-0"
      >
        {isPinned && <Pin className="w-3 h-3 text-white/40 flex-shrink-0" />}
        <div className="flex-1 truncate">
          <div className="text-sm font-medium truncate">{capitalizeTitle(item.title)}</div>
          <div className="text-[10px] text-white/20">{new Date(item.created_at).toLocaleDateString()}</div>
        </div>
      </button>

      <div ref={menuRef} className={`${isActive || showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity pr-2`}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-white/40" />
        </button>

        {showMenu && (
          <div className="absolute right-2 top-full mt-1 w-40 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            <button
              onClick={() => { onPin(item.id); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
            >
              <Pin className="w-4 h-4" />
              {isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => { onRename(item.id, item.title); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
            >
              <Edit3 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => { onDelete(item.id); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Logo image component with fallback
const LogoImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = useState(false);

  // Specific brand fallbacks with their colors
  if (error) {
    if (src.includes("anthropic") || src.includes("claude")) {
      // Claude: Orange/coral color with stylized logo
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#D97757"/>
          <circle cx="16" cy="11" r="5" fill="white"/>
          <path d="M8 24c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      );
    }
    if (src.includes("zhipu") || src.includes("glm") || src.includes("Zhipu") || src.includes("zai")) {
      // GLM: Z.ai logo - black rounded square with stylized white Z
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
          <path d="M25 35 L55 35 L25 65 L25 75 L75 75 L75 65 L45 65 L75 35 L75 25 L25 25 Z" fill="white"/>
        </svg>
      );
    }
    if (src.includes("chatgpt") || src.includes("gpt") || src.includes("openai")) {
      // GPT: Black rounded square with white geometric OpenAI logo
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="6" fill="#000000"/>
          <path d="M16 4L26 9V23L16 28L6 23V9L16 4Z" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M16 4V16M16 16L26 9M16 16L6 9" stroke="white" strokeWidth="1.5"/>
          <circle cx="16" cy="16" r="2" fill="white"/>
        </svg>
      );
    }
    return <span className={className}>🤖</span>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
};

const MODELS = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", logo: "https://www.gstatic.com/images/branding/product/2x/gemini_32dp.png" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.png" },
  { id: "gpt-5.4", name: "GPT 5.4", logo: "https://static.vecteezy.com/system/resources/previews/021/059/827/original/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super", logo: "https://www.nvidia.com/favicon.ico" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air", logo: "/zai-logo.png" },
  { id: "minimax/minimax-m2.5:free", name: "Minimax M2.5", logo: "https://www.minimaxi.com/favicon.ico" },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());
  const [renamingChat, setRenamingChat] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setUser(user);
      if (user) {
        fetchHistory(user.id);
      } else {
        setHistory([]);
        setMessages([]);
      }
    });

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        fetchHistory(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Click outside to close model selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };
    if (showModelSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelSelector]);

  // Capitalize first letter of first word
  const capitalizeTitle = (title: string) => {
    if (!title) return "";
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setHistory([]);
      return;
    }
    if (data) setHistory(data);
  };

  const loadChat = async (chatId: string) => {
    setActiveChatId(chatId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      setMessages([]);
      return;
    }
    if (data) setMessages(data.map(m => ({ role: m.role, content: m.content })));
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent, messageContent?: string) => {
    e.preventDefault();
    const content = messageContent || input;
    if (!content.trim() || loading) return;
    setError(null);

    const userMessage: Message = { role: "user", content };
    const currentMessages = [...messages, userMessage];
    if (!messageContent) {
      setMessages(currentMessages);
      setInput("");
    }
    setLoading(true);

    try {
      let chatId = activeChatId;

      // Try to save to Supabase but don't block if it fails
      if (user) {
        try {
          if (!chatId && user) {
            const { data: newChat, error: chatError } = await supabase
              .from('chats')
              .insert([{ user_id: user.id, title: content.slice(0, 30) + "..." }])
              .select('id')
              .single();

            if (!chatError && newChat) {
              chatId = newChat.id;
              setActiveChatId(chatId);
              fetchHistory(user.id);
            } else if (chatError) {
              console.warn("Chat create failed:", chatError.message);
            }
          }

          if (chatId && user) {
            const { error: msgError } = await supabase.from('messages').insert([{ chat_id: chatId, user_id: user.id, role: 'user', content: content }]);
            if (msgError) console.warn("Message save failed:", msgError.message);
          }
        } catch (dbErr: any) {
          console.warn("Database save failed, continuing with AI only:", dbErr?.message);
        }
      }

      // Use Puter.js directly for Gemini, Claude, GPT (browser-based, no auth token needed)
      let assistantContent: string;
      if (selectedModel.id.includes("gemini") || selectedModel.id.includes("claude") || selectedModel.id.includes("gpt-5.4")) {
        try {
          const response = await (window as any).puter.ai.chat(content, {
            model: selectedModel.id
          });
          // Puter.js returns {content, extra_content, role} or {message: {content: [...]}}
          let extractedContent: string;
          if (typeof response === 'string') {
            extractedContent = response;
          } else if (response?.message?.content && Array.isArray(response.message.content)) {
            // Claude format: {message: {content: [{text: "..."}]}}
            extractedContent = response.message.content.map((c: any) => c?.text || "").join("");
          } else if (response?.content && typeof response.content === 'string') {
            extractedContent = response.content;
          } else if (response?.message && typeof response.message === 'string') {
            extractedContent = response.message;
          } else if (response?.extra_content && typeof response.extra_content === 'string') {
            extractedContent = response.extra_content;
          } else {
            extractedContent = String(response);
          }
          assistantContent = extractedContent;
        } catch (puterError) {
          throw new Error("Puter.js failed: " + (puterError as Error).message);
        }
      } else {
        // Use backend for other models (OpenRouter)
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messageContent 
              ? [{ role: "user", content: messageContent }]
              : currentMessages,
            model: selectedModel.id
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || "AI response failed");
        }

        assistantContent = data.choices?.[0]?.message?.content;
        if (!assistantContent) {
          throw new Error("No content in response");
        }
      }

      const assistantMessage: Message = { role: "assistant", content: assistantContent, modelId: selectedModel.id };
      setMessages((prev) => [...prev, assistantMessage]);

      // Try to save assistant message
      if (user && chatId) {
        try {
          const { error: assocError } = await supabase.from('messages').insert([{ chat_id: chatId, user_id: user.id, role: 'assistant', content: assistantMessage.content, model_id: selectedModel.id }]);
          if (assocError) console.warn("Assistant message save failed:", assocError.message);
        } catch (dbErr: any) {
          console.warn("Database save failed for assistant message:", dbErr?.message);
        }
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      let errorMsg = err.message || "Something went wrong.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleRegenerate = (messageIndex: number) => {
    // Find the user message before this assistant message
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) return;
    
    const userMessage = messages[userMessageIndex];
    
    // Remove all messages from the assistant message onwards
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);
    
    // Trigger new response
    setTimeout(() => {
      handleSend({ preventDefault: () => {} } as React.FormEvent, userMessage.content);
    }, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Chat management functions
  const deleteChat = async (chatId: string) => {
    if (!user) return;
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    if (!error) {
      fetchHistory(user.id);
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    }
  };

  const togglePin = (chatId: string) => {
    setPinnedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const startRename = (chatId: string, currentTitle: string) => {
    setRenamingChat(chatId);
    setNewTitle(currentTitle);
  };

  const confirmRename = async (chatId: string) => {
    if (!user || !newTitle.trim()) return;
    const { error } = await supabase.from('chats').update({ title: newTitle.trim() }).eq('id', chatId);
    if (!error) {
      fetchHistory(user.id);
    }
    setRenamingChat(null);
    setNewTitle("");
  };


  return (
    <div className="h-screen flex bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 300 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="flex-shrink-0 border-r border-white/5 bg-black flex flex-col overflow-hidden"
      >
        <div onClick={() => setSidebarOpen(false)} className="p-6 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <img src="/favicon.ico" alt="" className="w-6 h-6" />
            <div className="text-xl font-bold tracking-tighter">Pwn AI.</div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <PanelLeftIcon className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="px-4 mb-6">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-4 mb-2">History</div>
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-white/20">No chats yet</div>
          ) : (
            history.map((item) => {
              const isActive = activeChatId === item.id;
              const isPinned = pinnedChats.has(item.id);
              const isRenaming = renamingChat === item.id;
              
              if (isRenaming) {
                return (
                  <div key={item.id} className="w-full px-4 py-2 rounded-xl bg-white/10">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(item.id);
                        if (e.key === "Escape") { setRenamingChat(null); setNewTitle(""); }
                      }}
                      onBlur={() => confirmRename(item.id)}
                      autoFocus
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                );
              }
              
              return (
                <HistoryItem 
                  key={item.id}
                  item={item}
                  isActive={isActive}
                  isPinned={isPinned}
                  onLoad={() => loadChat(item.id)}
                  onDelete={deleteChat}
                  onPin={togglePin}
                  onRename={startRename}
                  capitalizeTitle={capitalizeTitle}
                />
              );
            })
          )}
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/5 bg-[#0F0F0F]">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user?.email?.split('@')[0] || "User"}</div>
              <div className="text-[10px] text-white/40 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all">
              <LogOut className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-6 left-6 z-20 p-2 glass rounded-lg hover:bg-white/10 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-[70vh] flex flex-col items-center justify-center text-center"
                >
<div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-8">
                      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 4L6 12v8c0 7 5.6 13 14 16 8.4-3 14-9 14-16v-8l-14-8z" fill="black"/>
                        <path d="M14 18l4 4-4 4M26 18l-4 4 4 4M20 14v12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  <h2 className="text-4xl font-bold mb-4 tracking-tight">How can I help you today?</h2>
                                  </motion.div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 mb-8 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-white/10" : ""}`}>
                      {msg.role === "user" ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <LogoImage
                          src={MODELS.find(m => m.id === msg.modelId)?.logo || selectedModel.logo}
                          alt=""
                          className="w-8 h-8 rounded-md object-contain bg-black/20 p-0.5"
                        />
                      )}
                    </div>
                    {msg.role === "user" ? (
                      // User message bubble - pill if single line, rounded if multi
                      <div className={`bg-white text-black font-medium leading-relaxed text-lg whitespace-pre-wrap ${
                        msg.content.includes('\n') || msg.content.length > 50
                          ? 'rounded-2xl px-4 py-3' 
                          : 'rounded-full px-4 py-2'
                      }`}>
                        {msg.content}
                      </div>
                    ) : (
                      // AI response - no bubble, with action buttons
                      <div className="flex flex-col gap-2">
                        <div className="leading-relaxed text-lg text-white/90">
                          {msg.content}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                            title="Copy"
                          >
                            <Copy01Icon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRegenerate(i)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                            title="Regenerate"
                          >
                            <RedoIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-6 mb-8"
                >
                  <div className="w-10 h-10 flex items-center justify-center">
                    <LogoImage src={selectedModel.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-black/20 p-1" />
                  </div>
                  <div className="p-6 rounded-[2rem] glass flex items-center gap-4">
                    <span className="text-white/60 font-medium">Düşünülüyor</span>
                    <span className="loader" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <form onSubmit={handleSend} className="relative">
              <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl focus-within:border-white/20 transition-all shadow-2xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Pwn AI..."
                  className="w-full bg-transparent py-6 pl-8 pr-20 focus:outline-none text-lg"
                />

                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="relative" ref={modelSelectorRef}>
                    <button
                      type="button"
                      onClick={() => setShowModelSelector(!showModelSelector)}
                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-[12px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80 transition-all"
                    >
                      <LogoImage src={selectedModel.logo} alt="" className="w-5 h-5 rounded-md" />
                      Models
                      <motion.div
                        animate={{ rotate: showModelSelector ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronLeft className="w-3 h-3 rotate-90" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showModelSelector && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-4 w-64 glass rounded-2xl overflow-hidden z-30 shadow-2xl border border-white/10"
                        >
                          <div className="p-2 space-y-1">
                            {MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelSelector(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${selectedModel.id === model.id ? "bg-white text-black font-bold" : "hover:bg-white/5 text-white/70"}`}
                              >
                                <LogoImage src={model.logo} alt="" className="w-6 h-6 rounded-md" />
                                {model.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {loading ? (
                    <button
                      type="button"
                      onClick={() => {
                        setLoading(false);
                        setError("Stopped by user");
                      }}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-all shadow-lg"
                    >
                      <div className="w-3 h-3 bg-black rounded-sm" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-all disabled:opacity-50 disabled:scale-90 shadow-lg"
                    >
                      <CircleArrowUp02Icon className="w-6 h-6 text-black" fill="white" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
                  </div>
      </div>
    </div>
  );
}
