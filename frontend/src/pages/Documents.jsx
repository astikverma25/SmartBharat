import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, Square, MapPin, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config.js';

export default function Documents({ t, language, prefilledSearch, setPrefilledSearch }) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  // Auto-search if redirected with prefilled term
  useEffect(() => {
    if (prefilledSearch) {
      setGoal(prefilledSearch);
      handleLookup(prefilledSearch);
      setPrefilledSearch(''); // clear once processed
    }
  }, [prefilledSearch]);

  const handleLookup = async (searchTerm) => {
    const term = searchTerm || goal;
    if (!term.trim()) return;

    setLoading(true);
    setResult(null);
    setCheckedItems({});

    try {
      const response = await fetch(`${API_BASE_URL}/documents/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: term, language })
      });

      if (!response.ok) throw new Error('Document lookup failed');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Error searching document checklists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLookup();
  };

  const toggleCheck = (idx) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Search Input Card */}
      <div className="premium-card-flat p-6">
        <h2 className="font-semibold text-lg font-display text-[#1B2430] mb-4">
          {t('documents.title')}
        </h2>
        
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t('documents.placeholder')}
            className="premium-input flex-grow"
          />
          <button
            type="submit"
            disabled={loading || !goal.trim()}
            className="btn-primary py-3 px-6 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            <span>{t('documents.search')}</span>
          </button>
        </form>
      </div>

      {/* Lookup results */}
      {loading ? (
        <div className="text-center py-12 premium-card-flat">
          <RefreshCw size={32} className="animate-spin text-[#0B4F6C] mx-auto mb-2" />
          <p className="text-sm text-[#5C6570]">Retrieving required document checklists...</p>
        </div>
      ) : result && (
        <div className="premium-card-flat overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#0B4F6C] text-white px-6 py-4 flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] text-blue-200 block uppercase tracking-wider font-semibold">SERVICE CHECKLIST</span>
              <h3 className="font-semibold text-lg font-display mt-0.5">{result.service}</h3>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">{result.description}</p>
            </div>
            
            {result.official_url && (
              <a
                href={result.official_url}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all flex-shrink-0"
                title={t('documents.official_website')}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          <div className="p-6 space-y-6">
            
            {/* Warning Banner if unverified AI output */}
            {result.unverified && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 text-[#B23A2E] border border-red-100 rounded-xl text-xs leading-relaxed animate-pulse-soft">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t('chat.disclaimer_title')}</p>
                  <p className="text-[11px] mt-0.5">{t('chat.disclaimer_text')}</p>
                </div>
              </div>
            )}

            {/* Checklist of required items */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider">
                {t('documents.checklist_title')}
              </h4>

              <div className="space-y-2">
                {result.checklist.map((item, idx) => {
                  const isChecked = !!checkedItems[idx];
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleCheck(idx)}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-[#F7F6F2] border-[#E0DED7] hover:border-[#0B4F6C]'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${isChecked ? 'text-[#2F7A4D]' : 'text-[#8C95A0]'}`}>
                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                      </div>

                      <div className="space-y-1">
                        <span className={`text-sm font-semibold transition-all ${
                          isChecked ? 'line-through text-[#8C95A0] decoration-2' : 'text-[#1B2430]'
                        }`}>
                          {item.name}
                        </span>
                        
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.options.map((opt, oIdx) => (
                            <span key={oIdx} className="text-[10px] px-1.5 py-0.5 bg-white border border-[#E0DED7] rounded text-[#5C6570]">
                              {opt}
                            </span>
                          ))}
                        </div>

                        {item.format && (
                          <span className="block text-[10px] text-[#8C95A0] mt-1 italic">
                            Format required: {item.format}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-[#E0DED7]" />

            {/* Submission Locations & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5C6570]">
              <div className="flex items-start gap-2 bg-[#F7F6F2] p-3 rounded-xl border border-[#E0DED7]">
                <MapPin size={16} className="text-[#0B4F6C] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[9px] text-[#8C95A0]">
                    {t('documents.submission_at')}
                  </span>
                  <span className="text-[#1B2430] mt-0.5 block">{result.submission_location || 'Local RTO/Enrolment Office'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-[#F7F6F2] p-3 rounded-xl border border-[#E0DED7]">
                <Clock size={16} className="text-[#E08A2C] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-semibold uppercase tracking-wider text-[9px] text-[#8C95A0]">
                    {t('documents.processing_time')}
                  </span>
                  <span className="text-[#1B2430] mt-0.5 block">{result.processing_time || 'Varies by location'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
