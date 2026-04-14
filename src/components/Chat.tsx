import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User, Bot, LogOut, MessageSquare, Plus, Settings, Search, ChevronLeft, Menu, MoreHorizontal, Trash, Pin, Edit2 } from "lucide-react";
import { PanelLeftIcon } from "hugeicons-react";
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
  const modelSelectorRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<any>(null);
  const [mobileVisibleId, setMobileVisibleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownId, setDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setShowModelSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("click", () => setDropdownId(null));
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("click", () => setDropdownId(null));
    };
  }, []);

  const togglePin = async (chatId: string, currentPinned: boolean) => {
    const nextPinned = !currentPinned;
    setDropdownId(null);
    setHistory(prev => {
       const mapped = prev.map(c => c.id === chatId ? { ...c, pinned: nextPinned } : c);
       return mapped.sort((a: any, b: any) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
       });
    });
    try {
      const { error } = await supabase.from('chats').update({ pinned: nextPinned }).eq('id', chatId);
      if (error) console.error("Pin error, probably missing 'pinned' column in db", error);
    } catch (err) { }
  };

  const renameChat = async (chatId: string, oldTitle: string) => {
    setDropdownId(null);
    const newTitle = prompt("Sohbete yeni bir isim verin:", oldTitle);
    if (!newTitle || newTitle === oldTitle) return;
    setHistory(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
    try {
      await supabase.from('chats').update({ title: newTitle }).eq('id', chatId);
    } catch (err) {
      if (user) fetchHistory(user.id);
    }
  };

  const generateTitle = async (prompt: string, chatId: string, userId: string) => {
    try {
      const response = await (window as any).puter.ai.chat(
        `Aşağıdaki mesajı özetleyen 3-4 kelimelik çok kısa, sade ve noktalama işareti içermeyen bir başlık yaz. Sadece başlığı ver:\n\n${prompt}`,
        { model: "gpt-4o-mini" }
      );
      let title = "";
      if (typeof response === 'string') title = response;
      else if (response?.message?.content && Array.isArray(response.message.content)) title = response.message.content.map((c: any) => c?.text || "").join("");
      else if (response?.content) title = response.content;
      else if (response?.message) title = response.message;
      else if (response?.text) title = response.text;
      else if (response?.extra_content) title = response.extra_content;

      title = title.replace(/['"]/g, '').trim();
      if (title.length > 40) title = title.slice(0, 40) + "...";
      if (title.toLowerCase().startsWith("başlık:")) title = title.substring(7).trim();
      if (title) {
        await supabase.from('chats').update({ title }).eq('id', chatId);
        fetchHistory(userId);
      }
    } catch (e) {
      console.error("Title generation failed:", e);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm("Bu sohbeti silmek istediğinize emin misiniz?")) return;
    setDropdownId(null);
    setHistory((prev) => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      startNewChat();
    }
    try {
      await supabase.from('messages').delete().eq('chat_id', chatId);
      await supabase.from('chats').delete().eq('id', chatId);
    } catch (err) {
      console.error("Failed to delete chat", err);
      if (user) fetchHistory(user.id);
    }
  };


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
    if (data) {
      const sorted = data.sort((a: any, b: any) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setHistory(sorted);
    }
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
              generateTitle(input, chatId, user.id);
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
          let puterModel = "gpt-4o-mini";
          if (selectedModel.id.includes("gpt")) puterModel = "gpt-4o";
          else if (selectedModel.id.includes("claude")) puterModel = "claude-3-5-sonnet";
          
          const response = await (window as any).puter.ai.chat(input, {
            model: puterModel
          });
          // Puter.js returns {content, extra_content, role} or {message: {content: [...]}}
          let extractedContent: string;
          if (typeof response === 'string') {
            extractedContent = response;
          } else if (response?.message?.content && Array.isArray(response.message.content)) {
            extractedContent = response.message.content.map((c: any) => c?.text || "").join("");
          } else if (response?.content && typeof response.content === 'string') {
            extractedContent = response.content;
          } else if (response?.message && typeof response.message === 'string') {
            extractedContent = response.message;
          } else if (response?.text && typeof response.text === 'string') {
            extractedContent = response.text;
          } else if (response?.extra_content && typeof response.extra_content === 'string') {
            extractedContent = response.extra_content;
          } else {
            extractedContent = String(response);
          }
          assistantContent = extractedContent;
        } catch (puterError: any) {
          throw new Error("Puter.js failed: " + (puterError?.message || JSON.stringify(puterError)));
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

        <div className="px-4 mb-4 relative">
          <Search className="w-4 h-4 absolute left-8 top-1/2 -translate-y-1/2 text-white/40" />
          <input 
            type="text"
            placeholder="Sohbetlerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 px-4 mb-2">History</div>
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-white/20">No chats yet</div>
          ) : (
            history.filter((h) => h.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
              <div 
                key={item.id} 
                className={`w-full flex items-center px-2 py-2 rounded-xl transition-colors text-left group relative cursor-pointer ${activeChatId === item.id ? "bg-white/10" : "hover:bg-white/5"}`}
                onTouchStart={() => {
                  touchTimer.current = setTimeout(() => setMobileVisibleId(item.id), 500);
                }}
                onTouchEnd={() => {
                  if (touchTimer.current) clearTimeout(touchTimer.current);
                }}
                onTouchMove={() => {
                  if (touchTimer.current) clearTimeout(touchTimer.current);
                }}
                onClick={() => loadChat(item.id)}
              >
                <div className="flex-1 truncate px-2 text-left">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {(item as any).pinned && <Pin className="w-3 h-3 text-white/60" />}
                    {item.title}
                  </div>
                  <div className="text-[10px] text-white/20">{new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDropdownId(dropdownId === item.id ? null : item.id); }}
                    className={`p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all ${dropdownId === item.id || activeChatId === item.id || mobileVisibleId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 md:opacity-0 active:opacity-100"}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {dropdownId === item.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-10 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 w-44 overflow-hidden flex flex-col py-1"
                      >
                        <button onClick={(e) => { e.stopPropagation(); togglePin(item.id, !!(item as any).pinned); }} className="px-3 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white text-left flex items-center gap-3">
                          <Pin className="w-4 h-4" /> {(item as any).pinned ? "Sabitlemeyi Kaldır" : "Sohbeti Sabitle"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); renameChat(item.id, item.title); }} className="px-3 py-2 text-xs text-white/80 hover:bg-white/5 hover:text-white text-left flex items-center gap-3">
                          <Edit2 className="w-4 h-4" /> Yeniden Adlandır
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteChat(item.id); }} className="px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 text-left flex items-center gap-3">
                          <Trash className="w-4 h-4" /> Sohbeti Sil
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-white/5 bg-[#0F0F0F]">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user?.email ? user.email.charAt(0) : <User className="w-5 h-5 text-white/40" />}
                </div>
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
            <PanelLeftIcon className="w-5 h-5" />
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
            <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl focus-within:border-white/20 transition-all shadow-2xl" ref={modelSelectorRef}>
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
