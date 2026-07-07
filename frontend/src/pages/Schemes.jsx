import React, { useState } from 'react';
import { Award, Briefcase, IndianRupee, Map, User, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function Schemes({ t, language }) {
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');
  const [income, setIncome] = useState('');
  const [state, setState] = useState('');
  const [gender, setGender] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const occupationsList = [
    { value: 'Farmer', label: language === 'hi' ? 'किसान (Farmer)' : 'Farmer' },
    { value: 'Student', label: language === 'hi' ? 'छात्र (Student)' : 'Student' },
    { value: 'Unorganized Worker', label: language === 'hi' ? 'असंगठित मजदूर (Unorganized Worker)' : 'Unorganized Worker' },
    { value: 'Business Owner', label: language === 'hi' ? 'व्यवसायी (Business Owner)' : 'Business Owner' },
    { value: 'Salaried Employee', label: language === 'hi' ? 'वेतनभोगी (Salaried Employee)' : 'Salaried Employee' },
    { value: 'Unemployed', label: language === 'hi' ? 'बेरोजगार (Unemployed)' : 'Unemployed' },
    { value: 'Retired', label: language === 'hi' ? 'सेवानिवृत्त (Retired)' : 'Retired' }
  ];

  const incomeBrackets = [
    { value: '< 1.5 Lakhs', label: language === 'hi' ? '₹1.5 लाख से कम' : 'Below ₹1.5 Lakhs' },
    { value: '1.5 - 3 Lakhs', label: language === 'hi' ? '₹1.5 लाख - ₹3 लाख' : '₹1.5 Lakhs - ₹3 Lakhs' },
    { value: '3 - 6 Lakhs', label: language === 'hi' ? '₹3 लाख - ₹6 लाख' : '₹3 Lakhs - ₹6 Lakhs' },
    { value: '> 6 Lakhs', label: language === 'hi' ? '₹6 लाख से अधिक' : 'Above ₹6 Lakhs' }
  ];

  const statesList = [
    'Uttar Pradesh', 'Maharashtra', 'Delhi', 'Bihar', 'Tamil Nadu', 
    'Karnataka', 'West Bengal', 'Gujarat', 'Rajasthan', 'Madhya Pradesh'
  ];

  const handleRecommend = async (e, skipProfile = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    const payload = skipProfile 
      ? { language } 
      : { age, occupation, income_bracket: income, state, gender, language };

    try {
      const response = await fetch('/api/schemes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Recommendation service failed');
      const data = await response.json();
      setRecommendations(data);
      if (!skipProfile) {
        setIsFormCollapsed(true); // collapse profile form to show results prominently
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Form Card */}
      <div className="premium-card-flat overflow-hidden">
        {/* Toggleable Form Header */}
        <div 
          onClick={() => setHasSearched(prev => prev && setIsFormCollapsed(!isFormCollapsed))}
          className={`px-6 py-4 flex justify-between items-center bg-[#F7F6F2] border-b border-[#E0DED7] ${
            hasSearched ? 'cursor-pointer hover:bg-[#E0DED7]' : ''
          }`}
        >
          <h2 className="font-semibold text-base font-display text-[#1B2430]">
            {t('schemes.profile_title')}
          </h2>
          {hasSearched && (
            <div>
              {isFormCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </div>
          )}
        </div>

        {/* Collapsible Form Body */}
        {!isFormCollapsed && (
          <form onSubmit={(e) => handleRecommend(e, false)} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="text-xs font-semibold text-[#5C6570] flex items-center gap-1 mb-1">
                  <User size={12} />
                  <span>{t('schemes.age')}</span>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 52"
                  className="premium-input py-2 text-xs font-semibold"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-semibold text-[#5C6570] flex items-center gap-1 mb-1">
                  <User size={12} />
                  <span>Gender</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="premium-input py-2 text-xs font-semibold"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="text-xs font-semibold text-[#5C6570] flex items-center gap-1 mb-1">
                  <Briefcase size={12} />
                  <span>{t('schemes.occupation')}</span>
                </label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="premium-input py-2 text-xs font-semibold"
                >
                  <option value="">Select Occupation</option>
                  {occupationsList.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Family Income */}
              <div>
                <label className="text-xs font-semibold text-[#5C6570] flex items-center gap-1 mb-1">
                  <IndianRupee size={12} />
                  <span>{t('schemes.income')}</span>
                </label>
                <select
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="premium-input py-2 text-xs font-semibold"
                >
                  <option value="">Select Income Bracket</option>
                  {incomeBrackets.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-[#5C6570] flex items-center gap-1 mb-1">
                  <Map size={12} />
                  <span>{t('schemes.state')}</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="premium-input py-2 text-xs font-semibold"
                >
                  <option value="">Select State</option>
                  {statesList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-[#E5E3DC]">
              <button
                type="button"
                onClick={() => handleRecommend(null, true)}
                className="btn-secondary py-2 px-4 text-xs cursor-pointer"
              >
                {t('schemes.skipping')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-2.5 px-5 text-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <RefreshCw size={12} className="animate-spin" /> : <Award size={12} />}
                <span>{t('schemes.find_matches')}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recommended Schemes List */}
      {hasSearched && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg font-display text-[#1B2430]">
              {t('schemes.recommended')} ({recommendations.length})
            </h3>
            {isFormCollapsed && (
              <button 
                onClick={() => setIsFormCollapsed(false)}
                className="text-xs text-[#0B4F6C] hover:underline font-semibold"
              >
                Edit Profile Settings
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E0DED7] shadow-sm">
              <RefreshCw size={32} className="animate-spin text-[#0B4F6C] mx-auto mb-2" />
              <p className="text-sm text-[#5C6570]">AI is analyzing schemes eligibility...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E0DED7] shadow-sm text-sm text-[#5C6570]">
              No direct schemes found. Try selecting different occupation filters or expanding income ranges.
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div 
                  key={rec.id || index}
                  className="bg-white rounded-2xl p-6 border border-[#E0DED7] shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group"
                >
                  {/* Category color accent tag */}
                  <div className="absolute top-0 left-0 h-full w-1.5 bg-[#0B4F6C] group-hover:bg-[#E08A2C] transition-colors"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-blue-50 text-[#0B4F6C]">
                        {rec.category || 'Welfare'}
                      </span>
                      <h4 className="font-semibold text-lg text-[#1B2430] mt-1.5 font-display">
                        {rec.name}
                      </h4>
                    </div>

                    {rec.official_url && (
                      <a
                        href={rec.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 border border-[#E0DED7] rounded-lg text-[#5C6570] hover:text-[#0B4F6C] hover:bg-[#F7F6F2] transition-all flex-shrink-0"
                        title={t('schemes.visit_portal')}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  {/* Matching tailored reason */}
                  <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-100/50 text-xs">
                    <p className="font-semibold text-[#E08A2C] uppercase tracking-wider text-[9px] mb-1">
                      {t('schemes.why_match')}
                    </p>
                    <p className="text-[#5C6570] leading-relaxed italic">
                      🟠 Companion: "{rec.eligibility_reason}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
