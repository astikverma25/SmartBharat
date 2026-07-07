import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, HelpCircle, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

export default function Chat({
  t,
  language,
  initialChatMessage,
  setInitialChatMessage,
  setPage,
  setPrefilledComplaintText,
  setPrefilledDocumentSearch
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: language === 'hi' 
        ? 'नमस्ते! मैं आपका एआई साथी हूँ। मैं सरकारी योजनाओं, दस्तावेज़ सूचियों और शिकायत दर्ज करने में आपकी मदद कर सकता हूँ। आज आप क्या जानना चाहते हैं?' 
        : 'Hello! I am your AI Companion. I can help you find government schemes, document checklists, or report civic issues. What can I help you with today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentAiMode, setCurrentAiMode] = useState('checking');
  
  const messagesEndRef = useRef(null);
  const sendingRef = useRef(false);
  const hasSentInitial = useRef(false);

  useEffect(() => {
    // Check health endpoint on load
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.geminiConnected) {
          setCurrentAiMode('gemini');
        } else {
          setCurrentAiMode('offline');
        }
      })
      .catch(() => {
        setCurrentAiMode('offline');
      });
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial message from Home page search redirect
  useEffect(() => {
    if (initialChatMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialChatMessage);
      setInitialChatMessage(''); // Clear to avoid repeat triggers
    }
  }, [initialChatMessage]);

  const sendMessage = async (textToSend) => {
    if (sendingRef.current) return;
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    sendingRef.current = true;
    if (!textToSend) setInputValue('');

    // Append user message
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5), // Pass last 5 messages as context per PRD
          language,
          sessionId
        })
      });

      if (!response.ok) throw new Error('API server returned error');
      
      const data = await response.json();
      
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.aiMode) setCurrentAiMode(data.aiMode);

      // Append AI message with detected intent and confidence
      const aiMsg = {
        role: 'assistant',
        content: data.response,
        intent: data.intent,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      // Fallback message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'hi'
          ? 'माफ़ कीजियेगा, कुछ त्रुटि आ गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
          : 'I apologize, something went wrong on our end. Please try again in a moment.',
        error: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Helper to trigger actions based on intent detection
  const handleActionClick = (intent, botMsg) => {
    if (intent === 'complaint_intent') {
      // Prefill issue description
      const userQuestions = messages.filter(m => m.role === 'user');
      const lastUserQuestion = userQuestions[userQuestions.length - 1]?.content || '';
      setPrefilledComplaintText(lastUserQuestion);
      setPage('report');
    } else if (intent === 'document_requirement') {
      // Prefill search term (guess passport, ration, aadhaar, pan, driving)
      let keyword = '';
      const userQuestions = messages.filter(m => m.role === 'user');
      const text = (userQuestions[userQuestions.length - 1]?.content || '').toLowerCase();
      
      if (text.includes('passport') || text.includes('पासपोर्ट')) keyword = 'Passport';
      else if (text.includes('ration') || text.includes('राशन') || text.includes('rashan')) keyword = 'Ration Card';
      else if (text.includes('aadhaar') || text.includes('आधार') || text.includes('adhar')) keyword = 'Aadhaar Card';
      else if (text.includes('pan') || text.includes('पैन')) keyword = 'PAN Card';
      else if (text.includes('license') || text.includes('लाइसेंस') || text.includes('driving')) keyword = 'Driving License';
      
      setPrefilledDocumentSearch(keyword);
      setPage('documents');
    } else if (intent === 'scheme_recommendation') {
      setPage('schemes');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto premium-card-flat overflow-hidden">
      {/* Chat Header */}
      <div className="bg-[#0B4F6C] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E08A2C] flex items-center justify-center font-semibold text-lg animate-pulse-soft">
            स
          </div>
          <div>
            <h2 className="font-semibold text-base font-display flex items-center gap-1.5">
              {t('chat.title')} <Sparkles size={14} className="text-[#E08A2C]" />
            </h2>
            <p className="text-xs text-[#b8d6e3]">AI Civic Assistant • 24x7</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {currentAiMode === 'checking' && (
            <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/20 rounded font-mono font-semibold">
              CHECKING SYSTEM...
            </span>
          )}
          {currentAiMode === 'gemini' && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded font-mono font-semibold">
              GEMINI AI ACTIVE
            </span>
          )}
          {currentAiMode === 'mock' && (
            <span className="text-[10px] px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/30 rounded font-mono font-semibold" title="API Quota limits exceeded, running local heuristics">
              LIMIT FALLBACK ACTIVE
            </span>
          )}
          {currentAiMode === 'offline' && (
            <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/30 rounded font-mono font-semibold">
              LOCAL HEURISTICS
            </span>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-[#F7F6F2]">
        {messages.map((msg, index) => {
          const isAi = msg.role === 'assistant';
          
          return (
            <div key={index} className={`flex ${isAi ? 'justify-start' : 'justify-end'} animate-fade-in`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-4 shadow-sm relative ${
                isAi 
                  ? 'chat-bubble-ai' 
                  : 'chat-bubble-user'
              }`}>
                {/* AI Label */}
                {isAi && (
                  <div className="flex items-center gap-1 text-[10px] text-[#E08A2C] font-semibold uppercase tracking-wider mb-1">
                    <span>Companion • साथी</span>
                  </div>
                )}

                {/* Message text */}
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>

                {/* Action trigger chip based on intent */}
                {isAi && msg.intent && ['complaint_intent', 'document_requirement', 'scheme_recommendation'].includes(msg.intent) && (
                  <div className="mt-4 pt-3 border-t border-[#F2F1EC]">
                    <button
                      onClick={() => handleActionClick(msg.intent, msg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F6F2] hover:bg-[#E0DED7] text-[#0B4F6C] font-medium text-xs rounded-full border border-[#E0DED7] transition-all hover:scale-105"
                    >
                      {msg.intent === 'complaint_intent' && (
                        <>
                          <AlertTriangle size={12} className="text-[#B23A2E]" />
                          <span>{t('home.tiles.report')} →</span>
                        </>
                      )}
                      {msg.intent === 'document_requirement' && (
                        <>
                          <FileText size={12} className="text-[#0B4F6C]" />
                          <span>{t('chat.action_checklist')} →</span>
                        </>
                      )}
                      {msg.intent === 'scheme_recommendation' && (
                        <>
                          <Sparkles size={12} className="text-[#E08A2C]" />
                          <span>{t('chat.action_schemes')} →</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Low Confidence Disclaimer */}
                {isAi && msg.confidence && msg.confidence < 0.85 && (
                  <div className="mt-3 flex items-start gap-1.5 bg-red-50 text-[#B23A2E] p-2.5 rounded-lg border border-red-100 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t('chat.disclaimer_title')}</p>
                      <p className="text-[11px] mt-0.5">{t('chat.disclaimer_text')}</p>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <span className={`block text-[9px] mt-2 text-right ${isAi ? 'text-[#8C95A0]' : 'text-blue-200'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing loading indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-ai max-w-[85%] p-4 shadow-sm">
              <div className="flex items-center gap-1.5 py-1 px-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E08A2C] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E08A2C] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#E08A2C] animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Area */}
      <form onSubmit={handleSubmit} className="border-t border-[#E5E3DC] bg-[#FCFCFA]/90 backdrop-blur-md p-4 flex gap-2 sticky bottom-0 z-10">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('chat.placeholder')}
          disabled={isLoading}
          className="premium-input disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="btn-primary py-3 px-5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <span>{t('chat.send')}</span>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
