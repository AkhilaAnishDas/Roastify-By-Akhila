/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Video, 
  Send, 
  Settings, 
  Home, 
  Info, 
  Moon, 
  Sun, 
  Globe, 
  User, 
  Calendar,
  X,
  ChevronRight,
  Sparkles,
  Trash2,
  Smile,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { geminiService } from './services/geminiService';
import { Mood, Language, MOODS, LANGUAGES, DEFAULT_INPUTS, RoastOptions } from './types';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-[#E63946] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
        : 'hover:bg-black/5 text-inherit'
    }`}
  >
    <Icon size={20} />
    <span className="font-bold uppercase tracking-wider text-sm">{label}</span>
  </button>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 mt-6 px-3">
    {children}
  </h3>
);

// --- Main App ---

type View = 'home' | 'about' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<Language>('English');
  const [mood, setMood] = useState<Mood>('Roasting Funny');
  const [gender, setGender] = useState('Not Specified');
  const [age, setAge] = useState('Adult');
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<{ file: File, preview: string, type: string }[]>([]);
  const [roasts, setRoasts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHappy, setShowHappy] = useState(false);
  const [happyMessages, setHappyMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [happyInput, setHappyInput] = useState('');
  const [isHappyTyping, setIsHappyTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [happyMessages]);

  const onDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [],
      'audio/*': [],
      'video/*': []
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const playHappyVoice = async (text: string) => {
    setIsSpeaking(true);
    const base64Audio = await geminiService.generateSpeech(text);
    if (base64Audio) {
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => setIsSpeaking(false);
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setIsSpeaking(false);
      }
    } else {
      setIsSpeaking(false);
    }
  };

  const handleGenerateRoast = async (overrideText?: string) => {
    const textToUse = overrideText || inputText;
    if (!textToUse && files.length === 0) return;

    setIsGenerating(true);
    setRoasts([]);

    const fileData = await Promise.all(files.map(async (f) => {
      const reader = new FileReader();
      return new Promise<{ data: string, mimeType: string }>((resolve) => {
        reader.onload = () => resolve({ data: reader.result as string, mimeType: f.type });
        reader.readAsDataURL(f.file);
      });
    }));

    const options: RoastOptions = { mood, language, gender, age };
    const result = await geminiService.generateRoast(textToUse, fileData, options);
    
    const lines = result.split('\n').filter(l => l.trim().length > 0).slice(0, 3);
    setRoasts(lines);
    setIsGenerating(false);
  };

  const handleHappyChat = async () => {
    if (!happyInput.trim()) return;

    const userMsg = { role: 'user' as const, text: happyInput };
    setHappyMessages(prev => [...prev, userMsg]);
    setHappyInput('');
    setIsHappyTyping(true);

    const history = happyMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await geminiService.chatWithHappy(userMsg.text, history);
    
    setHappyMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsHappyTyping(false);
    playHappyVoice(response);
  };

  const toggleHappy = () => {
    if (!showHappy) {
      if (happyMessages.length === 0) {
        const welcome = "Hi, I am Happy! How can I be helpful today?";
        setHappyMessages([{ role: 'model', text: welcome }]);
        playHappyVoice(welcome);
      }
    }
    setShowHappy(!showHappy);
  };

  const INDIAN_DEFAULT_INPUTS = [
    "Roast my typical Indian wedding outfit.",
    "What do you think of my 'Sharma ji ka beta' complex?",
    "Roast my obsession with street food and bargaining.",
    "Tell me why my engineering degree is just a piece of paper.",
    "Roast my LinkedIn bio: 'Passionate about chai and coding'."
  ];

  return (
    <div className={`h-screen flex overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-[#E0E0E0]' : 'bg-[#F5F2ED] text-black'}`}>
      {/* --- SIDEBAR --- */}
      <aside className={`w-72 border-r-4 border-black flex flex-col p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#1E1E1E] border-white/20' : 'bg-[#F5F2ED]'}`}>
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-[#E63946] p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Flame className="text-white" size={24} fill="currentColor" />
          </div>
          <h1 className={`text-3xl font-black italic tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Roastify</h1>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarItem icon={Home} label="Home" active={view === 'home'} onClick={() => setView('home')} />
          <SidebarItem icon={Info} label="About" active={view === 'about'} onClick={() => setView('about')} />
          <SidebarItem icon={Settings} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />

          <SectionTitle>Theme</SectionTitle>
          <div className="flex gap-2 px-3">
            <button 
              onClick={() => setTheme('light')}
              className={`flex-1 p-2 border-2 border-black flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-yellow-400 text-black' : 'bg-white text-black opacity-50'}`}
            >
              <Sun size={16} /> <span className="text-[10px] font-bold uppercase">Light</span>
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`flex-1 p-2 border-2 border-black flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-black opacity-50'}`}
            >
              <Moon size={16} /> <span className="text-[10px] font-bold uppercase">Dark</span>
            </button>
          </div>

          <SectionTitle>Language</SectionTitle>
          <div className="px-3">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full p-2 border-2 border-black bg-white text-black font-bold text-xs uppercase focus:ring-2 ring-[#E63946]"
            >
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
          </div>

          <SectionTitle>Mood Level</SectionTitle>
          <div className="px-3 space-y-1">
            {MOODS.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all ${
                  mood === m 
                    ? 'bg-[#E63946] text-white translate-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white text-black hover:bg-black/5'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <SectionTitle>Profile</SectionTitle>
          <div className="px-3 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase flex items-center gap-1"><User size={10}/> Gender</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white text-black font-bold text-xs uppercase"
              >
                <option>Not Specified</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase flex items-center gap-1"><Calendar size={10}/> Age Group</label>
              <select 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white text-black font-bold text-xs uppercase"
              >
                <option>Child</option>
                <option>Teenager</option>
                <option>Adult</option>
                <option>Senior</option>
              </select>
            </div>
          </div>
        </nav>

        <div className="mt-6 pt-4 border-t-2 border-black/10 text-[10px] font-bold uppercase opacity-50">
          © 2026 Roastify <br/> Made with ⚡️ By THE DEBUGGERS
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Background Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

        <div className="flex-1 max-w-4xl mx-auto p-12 w-full">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Hero Section */}
                <header className="text-center mb-12 relative">
                  <motion.div 
                    initial={{ rotate: -2, scale: 0.9, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    className="inline-block border-4 border-black p-8 bg-white shadow-[12px_12px_0px_0px_rgba(230,57,70,1)] mb-6"
                  >
                    <h2 className="text-6xl font-black uppercase tracking-tighter leading-none mb-2 text-black">
                      The Great <span className="text-[#E63946]">Roast</span> Show
                    </h2>
                    <p className="text-xl font-serif italic text-black/60">"Where your ego comes to die, with a smile."</p>
                  </motion.div>
                </header>

                {/* Input Area */}
                <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-[#E63946]" size={20} />
                    <h3 className="text-lg font-black uppercase">Feed the Beast</h3>
                  </div>

                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tell me something about yourself, or paste a bio..."
                    className="w-full h-32 p-4 border-2 border-black bg-[#FDFCF0] text-black font-medium focus:outline-none focus:ring-2 ring-[#E63946]/20 resize-none mb-4"
                  />

                  {/* Multimodal Upload */}
                  <div {...getRootProps()} className={`border-2 border-dashed border-black p-6 text-center cursor-pointer transition-colors mb-4 ${isDragActive ? 'bg-[#E63946]/5' : 'bg-black/5 hover:bg-black/10'}`}>
                    <input {...getInputProps()} />
                    <div className="flex justify-center gap-4 mb-2">
                      <ImageIcon size={24} className="text-black/40" />
                      <Mic size={24} className="text-black/40" />
                      <Video size={24} className="text-black/40" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">
                      {isDragActive ? "Drop it like it's hot!" : "Drag & Drop Image, Audio, or Video"}
                    </p>
                  </div>

                  {/* File Previews */}
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-4 mb-6">
                      {files.map((f, i) => (
                        <div key={i} className="relative group">
                          {f.type.startsWith('image/') ? (
                            <img src={f.preview} alt="preview" className="w-20 h-20 object-cover border-2 border-black" />
                          ) : (
                            <div className="w-20 h-20 bg-black text-white flex items-center justify-center border-2 border-black">
                              {f.type.startsWith('audio/') ? <Mic size={24} /> : <Video size={24} />}
                            </div>
                          )}
                          <button 
                            onClick={() => removeFile(i)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => handleGenerateRoast()}
                    disabled={isGenerating || (!inputText && files.length === 0)}
                    className={`w-full py-4 border-4 border-black font-black uppercase tracking-widest text-xl transition-all flex items-center justify-center gap-3 ${
                      isGenerating 
                        ? 'bg-gray-200 cursor-not-allowed text-black/40' 
                        : 'bg-[#E63946] text-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1'
                    }`}
                  >
                    {isGenerating ? 'Cooking the Roast...' : 'Generate Roast'}
                    {!isGenerating && <Flame size={24} fill="currentColor" />}
                  </button>
                </div>

                {/* Default Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {INDIAN_DEFAULT_INPUTS.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setInputText(q);
                        handleGenerateRoast(q);
                      }}
                      className="text-left p-4 border-2 border-black bg-white text-black hover:bg-black/5 transition-colors group flex items-start gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <ChevronRight size={16} className="mt-1 text-[#E63946]" />
                      <span className="text-xs font-bold uppercase tracking-tight leading-relaxed">{q}</span>
                    </button>
                  ))}
                </div>

                {/* Roast Output */}
                <AnimatePresence mode="wait">
                  {roasts.length > 0 && (
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="space-y-4 pb-12"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="text-[#E63946]" size={20} />
                        <h3 className={`text-lg font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-black'}`}>The Verdict</h3>
                      </div>
                      {roasts.map((roast, i) => (
                        <motion.div 
                          key={i}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden text-black"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#E63946]"></div>
                          <p className="text-xl font-serif italic leading-relaxed">"{roast}"</p>
                        </motion.div>
                      ))}
                      <div className="flex justify-center pt-4">
                        <button 
                          onClick={() => setRoasts([])}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-[#E63946] transition-colors"
                        >
                          <Trash2 size={12} /> Clear Results
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {view === 'about' && (
              <motion.div 
                key="about"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black">
                  <h2 className="text-5xl font-black uppercase italic mb-6">About Roastify</h2>
                  <div className="space-y-4 font-serif text-lg leading-relaxed">
                    <p>Roastify is the world's first AI-powered vintage comedy club. We specialize in high-IQ, culturally relevant roasts that hit close to home.</p>
                    <p>Our mission is simple: To remind you that you're not as cool as you think you are, but in a way that makes you laugh.</p>
                    <p>Built by <strong>THE DEBUGGERS</strong>, a team of engineers who spent too much time getting roasted by their own code and decided to automate the process.</p>
                  </div>
                  <div className="mt-10 pt-10 border-t-4 border-black flex items-center gap-4">
                    <div className="bg-[#E63946] p-4 border-2 border-black text-white font-black uppercase italic">EST. 2026</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">Verified Authentic Comedy</div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white border-4 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-black">
                  <h2 className="text-5xl font-black uppercase italic mb-8">App Settings</h2>
                  
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-4 border-2 border-black">
                      <div>
                        <h4 className="font-black uppercase text-sm">Voice Feedback</h4>
                        <p className="text-xs opacity-60">Let Happy talk back to you loudly.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#E63946] border-2 border-black relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-2 h-2 bg-white"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-black">
                      <div>
                        <h4 className="font-black uppercase text-sm">Indian Society Context</h4>
                        <p className="text-xs opacity-60">Enable hyper-local cultural references.</p>
                      </div>
                      <div className="w-12 h-6 bg-[#E63946] border-2 border-black relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-2 h-2 bg-white"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border-2 border-black">
                      <div>
                        <h4 className="font-black uppercase text-sm">Nuclear Mode</h4>
                        <p className="text-xs opacity-60">Unlock the most savage roasts available.</p>
                      </div>
                      <div className="w-12 h-6 bg-black border-2 border-black relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-2 h-2 bg-white"></div>
                      </div>
                    </div>
                  </div>

                  <button className="mt-12 w-full py-4 bg-black text-white font-black uppercase tracking-widest border-4 border-black hover:bg-[#E63946] transition-colors">
                    Save All Changes
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className={`p-6 border-t-2 border-black/10 text-center text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-white/50'}`}>
          © 2026 Roastify — Made with ⚡️ By THE DEBUGGERS
        </footer>
      </main>

      {/* --- HAPPY CHATBOT --- */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {showHappy && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="w-80 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-4 flex flex-col h-[450px] text-black"
            >
              {/* Chat Header */}
              <div className="p-4 border-b-4 border-black bg-[#E63946] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1 rounded-full">
                    <Smile className="text-[#E63946]" size={16} />
                  </div>
                  <span className="font-black uppercase tracking-widest">Happy</span>
                  {isSpeaking && <Volume2 size={16} className="animate-pulse" />}
                </div>
                <button onClick={() => setShowHappy(false)} className="hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFCF0]">
                {happyMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 border-2 border-black font-bold text-xs ${
                      m.role === 'user' ? 'bg-[#E63946] text-white' : 'bg-white text-black'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isHappyTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-black p-2 flex gap-1">
                      <div className="w-1 h-1 bg-black animate-bounce"></div>
                      <div className="w-1 h-1 bg-black animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-black animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t-4 border-black bg-white flex gap-2">
                <input 
                  type="text"
                  value={happyInput}
                  onChange={(e) => setHappyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleHappyChat()}
                  placeholder="Say something nice..."
                  className="flex-1 p-2 border-2 border-black bg-[#FDFCF0] text-xs font-bold focus:outline-none"
                />
                <button 
                  onClick={handleHappyChat}
                  className="bg-black text-white p-2 border-2 border-black hover:bg-[#E63946] transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Happy Toggle Button */}
        <motion.button 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleHappy}
          className="bg-[#E63946] text-white p-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 group"
        >
          <span className="font-black uppercase tracking-widest overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-300">Talk to Happy</span>
          <Smile size={24} />
        </motion.button>
      </div>
    </div>
  );
}
