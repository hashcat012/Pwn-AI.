import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, LogOut, MessageSquare, Plus, Settings, Search, ChevronLeft, Menu } from "lucide-react";
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

const MODELS = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", logo: "https://www.gstatic.com/images/branding/product/2x/gemini_32dp.png" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.svg" },
  { id: "gpt-5.4", name: "GPT 5.4", logo: "https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/chatgpt-icon.svg" },
  { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super", logo: "https://www.nvidia.com/favicon.ico" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air", logo: "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMjQgMjQnIGZpbGw9J25vbmUnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzI0JyBoZWlnaHQ9JzI0JyByeD0nNCcgZmlsbD0nIzAwMDAwMCcvPjxwYXRoIGQ9J00xMy4yNDAyIDYuNzM5MjZMNS44MDg1OSAxNy4yNjc2SDEwLjc2MjdMMTguMTk0MyA2LjczOTI2SDEzLjI0MDJaTTEzLjE2MDIgMTUuNzE2OEMxMi45MjA2IDE1LjcxNjkgMTIuNjk0NyAxNS44MzY0IDEyLjU2MTUgMTYuMDI5M0wxMS42ODg1IDE3LjI2NzZIMTcuODgxOFYxNS43MTY4SDEzLjE2MDJaTTYuMTIxMDkgOC4yODQxOEgxMC44NDk2QzExLjA4OTMgOC4yODQxMiAxMS4zMTYxIDguMTY0NzUgMTEuNDQ5MiA3Ljk3MTY4TDEyLjMxNDUgNi43MzkyNkg2LjEyMTA5VjguMjg0MThaJyBmaWxsPScjRkZGRkZGJy8+PC9zdmc+" },
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setError(null);

    const userMessage: Message = { role: "user", content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setLoading(true);

    try {
      let chatId = activeChatId;

      // Try to save to Supabase but don't block if it fails
      if (user) {
        try {
          if (!chatId) {
            const { data: newChat, error: chatError } = await supabase
              .from('chats')
              .insert([{ user_id: user.id, title: input.slice(0, 30) + "..." }])
              .select()
              .single();

            if (!chatError && newChat) {
              chatId = newChat.id;
              setActiveChatId(chatId);
              fetchHistory(user.id);
            }
          }

          if (chatId) {
            await supabase.from('messages').insert([{ chat_id: chatId, user_id: user.id, role: 'user', content: input }]);
          }
        } catch (dbErr) {
          console.warn("Database save failed, continuing with AI only:", dbErr);
        }
      }

      // Use Puter.js directly for Gemini, Claude, GPT (browser-based, no auth token needed)
      let assistantContent: string;
      if (selectedModel.id.includes("gemini") || selectedModel.id.includes("claude") || selectedModel.id.includes("gpt-5.4")) {
        try {
          const response = await (window as any).puter.ai.chat(input, {
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
            messages: currentMessages,
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
          await supabase.from('messages').insert([{ chat_id: chatId, user_id: user.id, role: 'assistant', content: assistantMessage.content, model_id: selectedModel.id }]);
        } catch (dbErr) {
          console.warn("Database save failed for assistant message:", dbErr);
        }
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(err.message || "Something went wrong. Please check your API keys.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="h-screen flex bg-[#0A0A0A] text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 300 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="flex-shrink-0 border-r border-white/5 bg-[#0D0D0D] flex flex-col overflow-hidden"
      >
        <div onClick={() => setSidebarOpen(false)} className="p-6 flex items-center justify-between cursor-pointer">
          <div className="text-xl font-bold tracking-tighter">Pwn AI.</div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-white/40" />
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
            history.map((item) => (
              <button 
                key={item.id} 
                onClick={() => loadChat(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left group ${activeChatId === item.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <MessageSquare className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                <div className="flex-1 truncate">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-[10px] text-white/20">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </button>
            ))
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
                  <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-8">
                    <Bot className="w-10 h-10 text-white/80" />
                  </div>
                  <h2 className="text-4xl font-bold mb-4 tracking-tight">How can I help you today?</h2>
                  <p className="text-white/40 max-w-md mx-auto">Start a conversation with Pwn AI. Powered by {selectedModel.name} for lightning fast responses.</p>
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
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-white/10" : "glass"}`}>
                      {msg.role === "user" ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <img 
                          src={MODELS.find(m => m.id === msg.modelId)?.logo || selectedModel.logo} 
                          alt="" 
                          className="w-6 h-6 rounded-sm object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      )}
                    </div>
                    <div className={`p-6 rounded-[2rem] leading-relaxed text-lg ${msg.role === "user" ? "bg-white text-black font-medium" : "glass"}`}>
                      {msg.content}
                    </div>
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
                  <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center">
                    <img src={selectedModel.logo} alt="" className="w-6 h-6 rounded-sm object-contain" referrerPolicy="no-referrer" />
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
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowModelSelector(!showModelSelector)}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg text-[12px] font-bold uppercase tracking-wider text-white/40 hover:text-white/80 transition-all"
                  >
                    <img src={selectedModel.logo} alt="" className="w-3.5 h-3.5 rounded-sm" referrerPolicy="no-referrer" />
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
                              <img src={model.logo} alt="" className="w-4 h-4 rounded-sm" referrerPolicy="no-referrer" />
                              {model.name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all disabled:opacity-50 disabled:scale-90 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
        <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest font-bold">
          Pwn AI is powered by {selectedModel.name}.
        </p>
      </div>
      </div>
    </div>
  );
}
