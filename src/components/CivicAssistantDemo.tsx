import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MapPin, Sparkles, Database, ShieldAlert, Cpu, CheckCircle, ArrowRight, User, Bot, RefreshCw } from 'lucide-react';

interface ReportSim {
  id: number;
  text: string;
  category: string;
  severity: 'High' | 'Medium' | 'Low';
  location: string;
  department: string;
  duplicates: number;
}

export default function CivicAssistantDemo() {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'submit'>('submit');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(0); // 0: Idle, 1: Parsing, 2: Geo-location, 3: Fusion Check, 4: Auto-assign, 5: Done
  const [simResult, setSimResult] = useState<ReportSim | null>(null);

  // Chat interface state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    { sender: 'assistant', text: 'Hello! I am your AI Civic Assistant. You can describe any public civic issue in natural language (potholes, water leaks, broken lights), and I will catalog it and route it immediately.', time: '12:00 PM' },
  ]);

  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const presets: ReportSim[] = [
    {
      id: 1,
      text: "Huge pothole filled with stagnant water near Indiranagar Metro Station. Senior citizens are slipping.",
      category: "Road Infrastructure & Safety",
      severity: "High",
      location: "Indiranagar Double Rd, Bengaluru (Lat: 12.9716, Lng: 77.6412)",
      department: "Ward Executive Engineer, BBMP Roads Dept",
      duplicates: 3,
    },
    {
      id: 2,
      text: "Garbage pile has not been cleared for 5 days near sector 4 school. Stray animals are scattering it.",
      category: "Waste & Sanitation",
      severity: "High",
      location: "Sector 4 Block B, Noida Municipal Boundary (Lat: 28.5835, Lng: 77.3195)",
      department: "Solid Waste Management Cell, Sector 4 Div",
      duplicates: 1,
    },
    {
      id: 3,
      text: "Streetlight is broken on MG Road near the park entry. Entire corner is dark and feels unsafe.",
      category: "Street Lighting & Security",
      severity: "Medium",
      location: "MG Road Park Walkway, Pune (Lat: 18.5204, Lng: 73.8567)",
      department: "Electrical Division, MSEDCL/PMC",
      duplicates: 0,
    }
  ];

  const handleSelectPreset = (preset: ReportSim) => {
    if (isProcessing) return;
    setInputText(preset.text);
    setSimResult(preset);
  };

  const handleRunSimulation = () => {
    if (!inputText || isProcessing) return;
    setIsProcessing(true);
    setStep(1);

    // If text matches one of our presets, use it. Otherwise generate a dynamic one.
    const matched = presets.find(p => inputText.toLowerCase().includes(p.category.split(' ')[0].toLowerCase())) || presets[0];
    const finalResult = {
      ...matched,
      text: inputText,
    };
    setSimResult(finalResult);

    // Simulate multi-step processing pipeline
    setTimeout(() => {
      setStep(2); // Geo-tagging
      setTimeout(() => {
        setStep(3); // Fusion
        setTimeout(() => {
          setStep(4); // Dispatch
          setTimeout(() => {
            setStep(5); // Complete
            setIsProcessing(false);
          }, 1000);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: now }]);

    // Simulate AI typing and responding
    setTimeout(() => {
      let botResponse = "I have scanned your input. Let me route this as a service query. Would you like me to auto-populate the GPS location?";
      if (userMsg.toLowerCase().includes('pothole') || userMsg.toLowerCase().includes('road')) {
        botResponse = "I detect an infrastructure safety issue. Based on your report, I will draft an active ticket for 'Road Maintenance & Repair' with High Severity. Please confirm if this is located near your current GPS coordinate.";
      } else if (userMsg.toLowerCase().includes('garbage') || userMsg.toLowerCase().includes('trash')) {
        botResponse = "Understood. That is classified under 'Municipal Waste Management'. I've detected a similar report filed 300 meters away; I will merge these into a high-priority dispatch block to alert the local ward sanitation team.";
      } else if (userMsg.toLowerCase().includes('light') || userMsg.toLowerCase().includes('dark')) {
        botResponse = "I understand. Broken lighting compromises pedestrian safety. I am flagging this as 'Electrical Infrastructure'. Let me register the issue and schedule it for official inspection within 24 hours.";
      }

      setChatMessages(prev => [...prev, { sender: 'assistant', text: botResponse, time: now }]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <section id="interactive-demo" className="py-24 bg-transparent relative">
      {/* Background glow lines */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#14B8A6] font-mono tracking-widest uppercase">
            Live AI Playground
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
            See the AI Engine in Action
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            Experience how CivicQ processes plain-text descriptions of civic issues and initiates local dispatches instantly.
          </p>
        </div>

        {/* Dashboard Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Mode selection and Input fields */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Tab switchers */}
            <div className="bg-[#111827] border border-white/8 p-1.5 rounded-xl flex items-center justify-between">
              <button
                id="tab-submit"
                onClick={() => { setActiveTab('submit'); setStep(0); }}
                className={`w-1/2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'submit' ? 'bg-[#14B8A6] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                1. AI Report Pipeline
              </button>
              <button
                id="tab-chat"
                onClick={() => setActiveTab('chat')}
                className={`w-1/2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'chat' ? 'bg-[#14B8A6] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                2. Chat Assistant
              </button>
            </div>

            {/* Presets and entry fields */}
            {activeTab === 'submit' ? (
              <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-6">
                
                {/* Heading */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-300">
                    Select a Preset Issue
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click any sample to fill the input field.
                  </p>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-col gap-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-left p-3 rounded-xl border transition-all duration-300 text-xs ${
                        inputText === preset.text
                          ? 'bg-[#14B8A6]/10 border-[#14B8A6] text-[#14B8A6]'
                          : 'bg-[#0B1220]/60 border-white/5 text-gray-300 hover:border-white/12 hover:bg-[#0B1220]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-white">{preset.category}</span>
                        <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest text-[9px] ${
                          preset.severity === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {preset.severity}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-gray-400 font-sans leading-normal">
                        {preset.text}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Plain-text entry box */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">
                    Or Describe Custom Issue
                  </label>
                  <textarea
                    id="sim-textarea"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Describe potholes, garbage pileup, water stagnation, leaking mains, broken sidewalks, or dark poles..."
                    className="w-full h-24 p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white placeholder-gray-500 resize-none transition-all"
                  />
                </div>

                {/* Action CTA */}
                <button
                  id="btn-run-simulation"
                  onClick={handleRunSimulation}
                  disabled={!inputText || isProcessing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#22C55E] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#14B8A6]/20 active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing via CivicQ Engine...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Process Issue via AI
                    </>
                  )}
                </button>

              </div>
            ) : (
              /* Chat View Left Instructions */
              <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col gap-5 h-[420px] justify-between">
                <div className="flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center border border-[#14B8A6]/20">
                    <Bot className="w-5 h-5 text-[#14B8A6]" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Conversational Civic Assistant
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Rather than filling complex bureaucratic forms, users can talk with our AI Civic Assistant exactly like speaking to a helpful local warden.
                  </p>
                  <div className="flex flex-col gap-2.5 mt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#0B1220]/60 p-2.5 rounded-lg border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                      Translates colloquial, multi-lingual texts
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#0B1220]/60 p-2.5 rounded-lg border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                      Extracts locations automatically
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  ACTIVE AGENT • POWERED BY GEMINI PRO
                </div>
              </div>
            )}

          </div>

          {/* Right panel: Active live processing visualizations */}
          <div className="lg:col-span-7">
            <div className="bg-[#111827] border border-white/8 rounded-2xl p-6 flex flex-col h-full min-h-[420px] justify-between overflow-hidden relative">
              
              {/* If Chat Tab is Active, show conversational messenger */}
              {activeTab === 'chat' ? (
                <div className="flex flex-col h-[400px] justify-between">
                  {/* Messages container */}
                  <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-4 max-h-[320px]">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                          msg.sender === 'user' ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' : 'bg-[#14B8A6]/10 border-[#14B8A6]/20 text-[#14B8A6]'
                        }`}>
                          {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user' ? 'bg-[#22C55E]/10 text-[#22C55E] rounded-tr-none' : 'bg-[#0B1220]/90 text-gray-200 rounded-tl-none border border-white/5'
                        }`}>
                          <p>{msg.text}</p>
                          <span className="block text-[8px] text-gray-500 mt-1 text-right font-mono">
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <input
                      id="chat-input-bar"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Type a civic issue or question here..."
                      className="flex-grow p-3 rounded-xl bg-[#0B1220] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                    />
                    <button
                      id="btn-send-chat"
                      onClick={handleSendChat}
                      className="p-3 rounded-xl bg-[#14B8A6] hover:bg-[#14B8A6]/90 transition-colors text-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Submit Pipeline Live Analyzer View */
                <div className="flex flex-col justify-between h-full gap-6">
                  
                  {/* Top Status Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                      </span>
                      <span className="text-xs font-bold text-white tracking-wider font-mono uppercase">
                        AI REPORT CONDUIT
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">
                      CASE ID: {simResult ? `#CQ-${simResult.id}82` : 'WAITING'}
                    </span>
                  </div>

                  {/* Empty / Idle State */}
                  {step === 0 && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-white/3 flex items-center justify-center border border-white/8 text-gray-400 mb-4 animate-pulse">
                        <Cpu className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        AI Model Ready
                      </h4>
                      <p className="text-xs text-gray-400 max-w-sm">
                        Select a sample on the left or type your own report description, then hit "Process Issue via AI" to watch our analysis pipeline execute.
                      </p>
                    </div>
                  )}

                  {/* Processing Pipeline Steps (Animate each block) */}
                  {step > 0 && simResult && (
                    <div className="flex-grow flex flex-col gap-4">
                      
                      {/* Step 1: LLM Parsing */}
                      <div className={`p-3 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                        step >= 1 ? 'bg-[#0B1220]/80 border-white/8' : 'opacity-30 border-transparent'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          step > 1 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                        }`}>
                          {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                        </div>
                        <div className="flex-grow text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Classification & Intent Extraction</span>
                            {step === 1 && <span className="text-[10px] text-[#14B8A6] animate-pulse">Parsing text...</span>}
                          </div>
                          {step >= 1 && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-400 font-mono">
                              <div>Category: <span className="text-white font-sans font-medium">{simResult.category}</span></div>
                              <div>Severity: <span className="text-[#F59E0B] font-bold">{simResult.severity}</span></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Geo-location */}
                      <div className={`p-3 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                        step >= 2 ? 'bg-[#0B1220]/80 border-white/8' : 'opacity-30 border-transparent'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          step > 2 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                        }`}>
                          {step > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                        </div>
                        <div className="flex-grow text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Entity Geotagging & Mapping</span>
                            {step === 2 && <span className="text-[10px] text-[#14B8A6] animate-pulse">Calculating coordinates...</span>}
                          </div>
                          {step >= 2 && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#14B8A6] font-mono bg-[#14B8A6]/5 p-1.5 rounded border border-[#14B8A6]/10">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{simResult.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 3: Duplicate Fusion */}
                      <div className={`p-3 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                        step >= 3 ? 'bg-[#0B1220]/80 border-white/8' : 'opacity-30 border-transparent'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          step > 3 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                        }`}>
                          {step > 3 ? <CheckCircle className="w-4 h-4" /> : '3'}
                        </div>
                        <div className="flex-grow text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Duplicate Scan & Report Fusion</span>
                            {step === 3 && <span className="text-[10px] text-[#14B8A6] animate-pulse">Searching near coordinates...</span>}
                          </div>
                          {step >= 3 && (
                            <div className="mt-2 text-[11px] text-gray-400">
                              {simResult.duplicates > 0 ? (
                                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Detected {simResult.duplicates} matching reports. Merging reports to raise urgency coefficient by {(simResult.duplicates * 30).toFixed(0)}%.
                                </span>
                              ) : (
                                <span className="text-green-400 font-semibold">
                                  Unique report validated. Initiating brand new dispatcher entry.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Official Dispatch */}
                      <div className={`p-3 rounded-xl transition-all duration-300 flex items-start gap-3 border ${
                        step >= 4 ? 'bg-[#0B1220]/80 border-white/8' : 'opacity-30 border-transparent'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          step > 4 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#14B8A6]/10 text-[#14B8A6]'
                        }`}>
                          {step > 4 ? <CheckCircle className="w-4 h-4" /> : '4'}
                        </div>
                        <div className="flex-grow text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Smart Department Allocation</span>
                            {step === 4 && <span className="text-[10px] text-[#14B8A6] animate-pulse">Assigning agency...</span>}
                          </div>
                          {step >= 4 && (
                            <div className="mt-2 text-[11px] text-gray-200">
                              Assigned to: <span className="text-[#22C55E] font-bold font-mono">{simResult.department}</span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Summary / Success message */}
                  {step === 5 && simResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-[#22C55E]/10 to-[#14B8A6]/10 border border-[#22C55E]/20 flex items-center justify-between gap-4 mt-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/20 text-[#22C55E] shrink-0">
                          <CheckCircle className="w-5 h-5 animate-bounce" />
                        </div>
                        <div className="text-xs">
                          <h4 className="font-bold text-white">Report Successfully Queued!</h4>
                          <p className="text-gray-400">Official ward notifications dispatched. Real-time updates initiated.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setStep(0); setInputText(''); }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#111827] text-white border border-white/8 hover:border-white/15 transition-all text-[11px] font-bold uppercase tracking-wider"
                      >
                        Reset
                      </button>
                    </motion.div>
                  )}

                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
