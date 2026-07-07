import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, FileText, Search, ShieldAlert, Award, SearchCode } from 'lucide-react';

export default function Home({ t, setPage, setInitialChatMessage, recentComplaints }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allComplaints, setAllComplaints] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('/api/complaints')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch');
      })
      .then(data => {
        setAllComplaints(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error('Error fetching statistics:', err);
        setLoadingStats(false);
      });
  }, []);

  const total = allComplaints.length;
  const resolved = allComplaints.filter(c => c.status === 'resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category counts
  const categoryCounts = { pothole: 0, garbage: 0, streetlight: 0, water: 0, electricity: 0 };
  allComplaints.forEach(c => {
    if (c.category && categoryCounts[c.category] !== undefined) {
      categoryCounts[c.category]++;
    }
  });

  const totalCategoryFiles = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  // Urgency counts
  const highCount = allComplaints.filter(c => c.urgency === 'high').length;
  const mediumCount = allComplaints.filter(c => c.urgency === 'medium').length;
  const lowCount = allComplaints.filter(c => c.urgency === 'low').length;

  const totalUrgency = highCount + mediumCount + lowCount;
  const highPct = totalUrgency > 0 ? Math.round((highCount / totalUrgency) * 100) : 0;
  const mediumPct = totalUrgency > 0 ? Math.round((mediumCount / totalUrgency) * 100) : 0;
  const lowPct = totalUrgency > 0 ? Math.round((lowCount / totalUrgency) * 100) : 0;

  // Calculate average response time dynamically based on the difference between created_at and updated_at
  const respondedComplaints = allComplaints.filter(c => c.status !== 'submitted');
  let avgResponseHours = 0;
  if (respondedComplaints.length > 0) {
    const totalResponseMs = respondedComplaints.reduce((sum, c) => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at).getTime();
      const diff = updated - created;
      return sum + (diff > 0 ? diff : 0);
    }, 0);
    const avgResponseMs = totalResponseMs / respondedComplaints.length;
    avgResponseHours = Math.round(avgResponseMs / (1000 * 60 * 60));
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setInitialChatMessage(searchQuery);
      setPage('chat');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* AI Companion Warm Greeting Banner */}
      <div className="premium-card bg-gradient-to-br from-white to-[#FBFBFA]/50 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-[#E08A2C]"></div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E08A2C] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 animate-bounce-slow">
            स
          </div>
          <div className="space-y-4 flex-grow">
            <div>
              <p className="text-xs text-[#E08A2C] font-semibold tracking-wider uppercase">AI Companion • साथी</p>
              <h2 className="text-xl md:text-2xl font-display font-semibold text-[#1B2430] mt-1">
                {t('home.greeting')} 👋
              </h2>
              <p className="text-[#5C6570] text-sm md:text-base mt-1">
                {t('home.subtitle')}
              </p>
            </div>
            
            {/* Embedded Search input inside companion card */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="w-full pl-5 pr-12 py-3.5 bg-[#F7F6F2] rounded-xl border border-[#E0DED7] text-sm focus:outline-none focus:border-[#0B4F6C] focus:ring-4 focus:ring-[#0B4F6C]/10 transition-all font-medium"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#E08A2C] text-white rounded-lg hover:bg-[#c9741e] hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                aria-label="Ask"
              >
                <Search size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main 4 Entry Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Report Civic Issue Tile */}
        <button
          onClick={() => setPage('report')}
          className="premium-card p-6 text-left group flex items-start gap-4 cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-red-50 text-[#B23A2E] group-hover:bg-[#B23A2E] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1B2430] group-hover:text-[#0B4F6C]">
              {t('home.tiles.report')}
            </h3>
            <p className="text-sm text-[#5C6570] mt-1">
              {t('home.tiles.report_desc')}
            </p>
          </div>
        </button>

        {/* Required Documents Checklist Tile */}
        <button
          onClick={() => setPage('documents')}
          className="premium-card p-6 text-left group flex items-start gap-4 cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-blue-50 text-[#0B4F6C] group-hover:bg-[#0B4F6C] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1B2430] group-hover:text-[#0B4F6C]">
              {t('home.tiles.documents')}
            </h3>
            <p className="text-sm text-[#5C6570] mt-1">
              {t('home.tiles.documents_desc')}
            </p>
          </div>
        </button>

        {/* Schemes Recommendation Tile */}
        <button
          onClick={() => setPage('schemes')}
          className="premium-card p-6 text-left group flex items-start gap-4 cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
            <Award size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1B2430] group-hover:text-[#0B4F6C]">
              {t('home.tiles.schemes')}
            </h3>
            <p className="text-sm text-[#5C6570] mt-1">
              {t('home.tiles.schemes_desc')}
            </p>
          </div>
        </button>

        {/* Track Complaint Tile */}
        <button
          onClick={() => setPage('track')}
          className="premium-card p-6 text-left group flex items-start gap-4 cursor-pointer"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-[#2F7A4D] group-hover:bg-[#2F7A4D] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
            <SearchCode size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1B2430] group-hover:text-[#0B4F6C]">
              {t('home.tiles.track')}
            </h3>
            <p className="text-sm text-[#5C6570] mt-1">
              {t('home.tiles.track_desc')}
            </p>
          </div>
        </button>
      </div>

      {/* Interactive Statistics Dashboard Section */}
      <div className="premium-card bg-gradient-to-br from-white to-[#FBFBFA]/50 p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-[#0B4F6C]"></div>
        <div>
          <h3 className="font-semibold text-lg text-[#1B2430] font-display flex items-center gap-2">
            <Award size={20} className="text-[#0B4F6C]" />
            Smart Bharat Civic Insights (शहर के आंकड़े)
          </h3>
          <p className="text-xs text-[#8C95A0] mt-0.5">Real-time civic dashboard of municipal reports and resolution performance.</p>
        </div>

        {loadingStats ? (
          <div className="text-center py-8 text-xs text-[#8C95A0]">Loading real-time metrics...</div>
        ) : total === 0 ? (
          <div className="text-center py-8 text-xs text-[#8C95A0]">No complaints registered yet to generate statistical metrics.</div>
        ) : (
          <>
            {/* Top Highlight Metric Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F7F6F2] p-4 rounded-xl border border-[#E0DED7] text-center shadow-inner">
                <span className="block text-[10px] text-[#8C95A0] uppercase font-bold tracking-wider">Reported</span>
                <span className="font-mono text-2xl font-extrabold text-[#0B4F6C] block mt-1">{total}</span>
                <span className="text-[10px] text-[#2F7A4D] font-semibold mt-0.5 inline-block">Active cases</span>
              </div>
              <div className="bg-[#F7F6F2] p-4 rounded-xl border border-[#E0DED7] text-center shadow-inner">
                <span className="block text-[10px] text-[#8C95A0] uppercase font-bold tracking-wider">Resolved</span>
                <span className="font-mono text-2xl font-extrabold text-[#2F7A4D] block mt-1">{resolved}</span>
                <span className="text-[10px] text-[#2F7A4D] font-semibold mt-0.5 inline-block">Closed cases</span>
              </div>
              <div className="bg-[#F7F6F2] p-4 rounded-xl border border-[#E0DED7] text-center shadow-inner">
                <span className="block text-[10px] text-[#8C95A0] uppercase font-bold tracking-wider">Resolution Rate</span>
                <span className="font-mono text-2xl font-extrabold text-[#E08A2C] block mt-1">
                  {resolutionRate}%
                </span>
                <span className="text-[10px] text-[#8C95A0] font-medium mt-0.5 inline-block">Target: 85%</span>
              </div>
              <div className="bg-[#F7F6F2] p-4 rounded-xl border border-[#E0DED7] text-center shadow-inner">
                <span className="block text-[10px] text-[#8C95A0] uppercase font-bold tracking-wider">Avg. Response</span>
                <span className="font-mono text-2xl font-extrabold text-[#0B4F6C] block mt-1">
                  {respondedComplaints.length > 0 
                    ? (avgResponseHours === 0 ? '< 1 Hr' : `${avgResponseHours} Hrs`)
                    : 'Pending'
                  }
                </span>
                <span className="text-[10px] text-[#2F7A4D] font-semibold mt-0.5 inline-block">
                  {respondedComplaints.length > 0 ? 'Live Data' : 'No responses yet'}
                </span>
              </div>
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Category Distribution Bar Chart */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-[#5C6570] uppercase tracking-wider block">Grievance Distribution</span>
                <div className="space-y-3">
                  {Object.entries(categoryCounts).map(([name, count]) => {
                    const percentage = totalCategoryFiles > 0 ? Math.round((count / totalCategoryFiles) * 100) : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[#1B2430] capitalize">{t(`categories.${name}`)}</span>
                          <span className="text-[#5C6570] font-mono">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 w-full bg-[#E5E3DC] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              name === 'pothole' ? 'bg-[#B23A2E]' :
                              name === 'garbage' ? 'bg-[#E08A2C]' :
                              name === 'streetlight' ? 'bg-[#0B4F6C]' :
                              'bg-[#2F7A4D]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SVG Pie Chart/Donut breakdown of urgency levels */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center md:justify-start">
                <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E5E3DC" strokeWidth="3" />
                    {highPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#B23A2E" strokeWidth="3" 
                              strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset="0" />
                    )}
                    {mediumPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E08A2C" strokeWidth="3" 
                              strokeDasharray={`${mediumPct} ${100 - mediumPct}`} strokeDashoffset={`-${highPct}`} />
                    )}
                    {lowPct > 0 && (
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2F7A4D" strokeWidth="3" 
                              strokeDasharray={`${lowPct} ${100 - lowPct}`} strokeDashoffset={`-${highPct + mediumPct}`} />
                    )}
                  </svg>
                  <div className="absolute w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-xs font-bold text-[#1B2430]">Priority</span>
                    <span className="text-[9px] text-[#8C95A0] font-semibold font-mono">Breakdown</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#5C6570] uppercase tracking-wider block">Urgency Metrics</span>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#1B2430]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B23A2E]"></span>
                    <span>Critical / High ({highPct}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#1B2430]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E08A2C]"></span>
                    <span>Standard / Medium ({mediumPct}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#1B2430]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2F7A4D]"></span>
                    <span>General / Low ({lowPct}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="premium-card-flat p-6">
        <h3 className="font-semibold text-lg text-[#1B2430] border-b border-[#E0DED7] pb-3 font-display">
          {t('home.recent_activity')}
        </h3>
        
        {recentComplaints.length === 0 ? (
          <div className="text-center py-8 text-[#5C6570] text-sm flex flex-col items-center gap-2">
            <AlertCircle size={32} className="text-[#C4C2BC]" />
            <p>{t('home.no_activity')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E0DED7]">
            {recentComplaints.map((c) => (
              <div key={c.tracking_id} className="py-4 first:pt-2 last:pb-2 flex justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[#0B4F6C]">{c.tracking_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.urgency === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                      c.urgency === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                      'bg-blue-50 text-[#0B4F6C]'
                    }`}>
                      {t(`categories.${c.category}`)} • {t(`urgency.${c.urgency}`)}
                    </span>
                  </div>
                  <p className="text-sm text-[#5C6570] mt-1 line-clamp-1">{c.description}</p>
                </div>
                
                 <button
                  onClick={() => {
                    localStorage.setItem('smart_bharat_last_track_id', c.tracking_id);
                    setPage('track');
                  }}
                  className="px-3.5 py-1.5 border border-[#0B4F6C]/30 text-[#0B4F6C] rounded-lg text-xs font-semibold hover:bg-[#0B4F6C] hover:text-white hover:border-[#0B4F6C] transition-all cursor-pointer shadow-sm"
                >
                  {t('report.track_now')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
