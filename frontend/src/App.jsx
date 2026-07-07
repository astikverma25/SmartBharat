import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, MessageSquare, AlertTriangle, SearchCode, Award, Globe, Menu, X, Landmark, FileText } from 'lucide-react';

// Import pages
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';
import ReportIssue from './pages/ReportIssue.jsx';
import TrackComplaint from './pages/TrackComplaint.jsx';
import Schemes from './pages/Schemes.jsx';
import Documents from './pages/Documents.jsx';
import Admin from './pages/Admin.jsx';

// Import i18n
import en from './i18n/en.json';
import hi from './i18n/hi.json';

const translations = { en, hi };

export default function App() {
  const [page, setPage] = useState('home');
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('smart_bharat_lang') || 'en';
  });
  
  const [initialChatMessage, setInitialChatMessage] = useState('');
  const [prefilledComplaintText, setPrefilledComplaintText] = useState('');
  const [prefilledDocumentSearch, setPrefilledDocumentSearch] = useState('');
  
  const [recentComplaints, setRecentComplaints] = useState(() => {
    const saved = localStorage.getItem('smart_bharat_recent_complaints');
    return saved ? JSON.parse(saved) : [];
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem('smart_bharat_lang', language);
  }, [language]);

  // Fetch recent complaints from database on mount or page change to Home
  useEffect(() => {
    if (page === 'home') {
      fetch('/api/complaints')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch');
        })
        .then(data => {
          setRecentComplaints(data.slice(0, 5)); // Keep top 5
        })
        .catch(err => {
          console.error('Error fetching complaints from DB:', err);
        });
    }
  }, [page]);

  // Sync recent complaints to localStorage
  const addRecentComplaint = (complaint) => {
    setRecentComplaints((prev) => {
      const updated = [complaint, ...prev].slice(0, 5); // Keep last 5
      localStorage.setItem('smart_bharat_recent_complaints', JSON.stringify(updated));
      return updated;
    });
  };

  // Translation helper
  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let value = translations[language];
    for (const key of keys) {
      if (value) value = value[key];
    }
    return value || keyPath;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1B2430] flex flex-col font-body pb-16 md:pb-0">
      
      {/* Global Navigation Header */}
      <header className="bg-[#0B4F6C] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div 
            onClick={() => setPage('home')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-[#0B4F6C] font-semibold text-lg border border-[#E0DED7] transition-all duration-300 group-hover:scale-105">
              🇮🇳
            </div>
            <div>
              <h1 className="font-display font-bold text-base md:text-lg tracking-wider">
                Smart Bharat
              </h1>
              <span className="text-[9px] uppercase tracking-widest text-[#E08A2C] font-bold block -mt-0.5">
                Civic Companion • साथी
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setPage('home')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'home' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <HomeIcon size={14} />
              <span>{t('nav.home')}</span>
            </button>
            <button 
              onClick={() => setPage('chat')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'chat' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>{t('nav.chat')}</span>
            </button>
            <button 
              onClick={() => setPage('report')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'report' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <AlertTriangle size={14} />
              <span>{t('nav.report')}</span>
            </button>
            <button 
              onClick={() => setPage('track')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'track' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <SearchCode size={14} />
              <span>{t('nav.track')}</span>
            </button>
            <button 
              onClick={() => setPage('schemes')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'schemes' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <Award size={14} />
              <span>{t('nav.schemes')}</span>
            </button>
            <button 
              onClick={() => setPage('documents')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'documents' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>{t('nav.documents')}</span>
            </button>
            <button 
              onClick={() => setPage('admin')}
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer py-1.5 border-b-2 ${
                page === 'admin' ? 'text-white border-[#E08A2C]' : 'text-blue-100 border-transparent hover:text-white'
              }`}
            >
              <Landmark size={14} />
              <span>{t('nav.admin')}</span>
            </button>
          </nav>

          {/* Right Header Options (Lang toggle & mobile menu icon) */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-[#1a6486] hover:bg-[#207aa3] text-white rounded-lg transition-colors border border-blue-400/30 cursor-pointer"
            >
              <Globe size={14} className="text-[#E08A2C]" />
              <span>{language === 'en' ? 'हिं (Hindi)' : 'EN (English)'}</span>
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 hover:bg-[#1a6486] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A455E] border-t border-blue-800/40 p-4 space-y-2 animate-fade-in">
            <button 
              onClick={() => { setPage('home'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <HomeIcon size={16} />
              <span>{t('nav.home')}</span>
            </button>
            <button 
              onClick={() => { setPage('chat'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>{t('nav.chat')}</span>
            </button>
            <button 
              onClick={() => { setPage('report'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <AlertTriangle size={16} />
              <span>{t('nav.report')}</span>
            </button>
            <button 
              onClick={() => { setPage('track'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <SearchCode size={16} />
              <span>{t('nav.track')}</span>
            </button>
            <button 
              onClick={() => { setPage('schemes'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <Award size={16} />
              <span>{t('nav.schemes')}</span>
            </button>
            <button 
              onClick={() => { setPage('documents'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <FileText size={16} />
              <span>{t('nav.documents')}</span>
            </button>
            <button 
              onClick={() => { setPage('admin'); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 py-2 px-3 hover:bg-[#1a6486] rounded-lg text-sm text-left transition-colors cursor-pointer"
            >
              <Landmark size={16} />
              <span>{t('nav.admin')}</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Dynamic Workspace Frame */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-6 py-6">
        {page === 'home' && (
          <Home 
            t={t} 
            setPage={setPage} 
            setInitialChatMessage={setInitialChatMessage} 
            recentComplaints={recentComplaints}
          />
        )}
        
        {page === 'chat' && (
          <Chat 
            t={t}
            language={language}
            initialChatMessage={initialChatMessage}
            setInitialChatMessage={setInitialChatMessage}
            setPage={setPage}
            setPrefilledComplaintText={setPrefilledComplaintText}
            setPrefilledDocumentSearch={setPrefilledDocumentSearch}
          />
        )}

        {page === 'report' && (
          <ReportIssue
            t={t}
            language={language}
            prefilledText={prefilledComplaintText}
            setPage={setPage}
            addRecentComplaint={addRecentComplaint}
          />
        )}

        {page === 'track' && (
          <TrackComplaint 
            t={t}
          />
        )}

        {page === 'schemes' && (
          <Schemes 
            t={t}
            language={language}
          />
        )}

        {page === 'documents' && (
          <Documents 
            t={t}
            language={language}
            prefilledSearch={prefilledDocumentSearch}
            setPrefilledSearch={setPrefilledDocumentSearch}
          />
        )}

        {page === 'admin' && (
          <Admin 
            t={t}
          />
        )}
      </main>

      {/* Persistent Floating Action Companion Button (Not visible on chat page itself) */}
      {page !== 'chat' && (
        <button
          onClick={() => setPage('chat')}
          className="fixed bottom-6 right-6 bg-[#E08A2C] hover:bg-[#c9741e] text-white px-4 py-3 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50 cursor-pointer animate-float"
        >
          <div className="w-6 h-6 rounded-full bg-white text-[#E08A2C] flex items-center justify-center font-bold text-xs">
            स
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider">
            {language === 'hi' ? 'साथी से पूछें' : 'Ask Companion'}
          </span>
        </button>
      )}

      {/* Mobile Footer Tab Bar (Always visible on mobile view) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B4F6C] border-t border-blue-800/40 flex justify-around items-center px-2 z-40 text-blue-100">
        <button 
          onClick={() => setPage('home')}
          className={`flex flex-col items-center justify-center flex-grow py-1 cursor-pointer transition-colors ${page === 'home' ? 'text-white font-semibold' : 'text-blue-200'}`}
        >
          <HomeIcon size={18} />
          <span className="text-[9px] mt-1">{t('nav.home')}</span>
        </button>
        
        <button 
          onClick={() => setPage('report')}
          className={`flex flex-col items-center justify-center flex-grow py-1 cursor-pointer transition-colors ${page === 'report' ? 'text-white font-semibold' : 'text-blue-200'}`}
        >
          <AlertTriangle size={18} />
          <span className="text-[9px] mt-1">{t('nav.report')}</span>
        </button>

        <button 
          onClick={() => setPage('chat')}
          className="flex flex-col items-center justify-center relative -top-4 w-12 h-12 bg-[#E08A2C] text-white rounded-full shadow-md border-2 border-[#0B4F6C]"
        >
          <MessageSquare size={20} />
        </button>

        <button 
          onClick={() => setPage('track')}
          className={`flex flex-col items-center justify-center flex-grow py-1 cursor-pointer transition-colors ${page === 'track' ? 'text-white font-semibold' : 'text-blue-200'}`}
        >
          <SearchCode size={18} />
          <span className="text-[9px] mt-1">{t('nav.track')}</span>
        </button>
        
        <button 
          onClick={() => setPage('schemes')}
          className={`flex flex-col items-center justify-center flex-grow py-1 cursor-pointer transition-colors ${page === 'schemes' ? 'text-white font-semibold' : 'text-blue-200'}`}
        >
          <Award size={18} />
          <span className="text-[9px] mt-1">{t('nav.schemes')}</span>
        </button>
      </div>

    </div>
  );
}
