import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, AlertCircle, CheckCircle, RefreshCw, UserCheck, FileText } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { API_BASE_URL } from '../config.js';

export default function TrackComplaint({ t }) {
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime', '.avi'];
    const lowerUrl = url.toLowerCase();
    return videoExts.some(ext => lowerUrl.includes(ext) || lowerUrl.endsWith(ext));
  };

  const parseAttachments = (photoUrl) => {
    if (!photoUrl) return { photos: [], videos: [] };
    if (photoUrl.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(photoUrl);
        return {
          photos: parsed.photos || [],
          videos: parsed.videos || []
        };
      } catch (e) {
        console.error('Failed to parse attachments JSON:', e);
      }
    }
    const isVideo = isVideoUrl(photoUrl);
    return {
      photos: isVideo ? [] : [photoUrl],
      videos: isVideo ? [photoUrl] : []
    };
  };

  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [recentList, setRecentList] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch recent complaints on mount/status updates
  useEffect(() => {
    fetch(`${API_BASE_URL}/complaints`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecentList(data.slice(0, 5)))
      .catch(err => console.error(err));
  }, [complaint]);

  const handleCopy = (id, event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Load last tracking ID on mount if exists
  useEffect(() => {
    const savedId = localStorage.getItem('smart_bharat_last_track_id');
    if (savedId) {
      setTrackingId(savedId);
      fetchComplaint(savedId);
      localStorage.removeItem('smart_bharat_last_track_id'); // clear once loaded
    }
  }, []);

  const fetchComplaint = async (idToSearch) => {
    const id = idToSearch || trackingId;
    if (!id.trim()) return;

    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${id}`);
      if (!response.ok) {
        throw new Error('Complaint not found');
      }
      const data = await response.json();
      setComplaint(data);
    } catch (err) {
      console.error(err);
      setError(t('track.not_found'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!complaint) return;
    const reportText = `SMART BHARAT CIVIC COMPANION - OFFICIAL COMPLAINT REPORT
=======================================================
Tracking ID : ${complaint.tracking_id}
Status      : ${complaint.status.toUpperCase()}
Category    : ${complaint.category.toUpperCase()}
Urgency     : ${complaint.urgency.toUpperCase()}
Filed Date  : ${new Date(complaint.created_at).toLocaleString()}
Last Update : ${new Date(complaint.updated_at).toLocaleString()}

Coordinates : Latitude ${complaint.latitude || 'N/A'}, Longitude ${complaint.longitude || 'N/A'}

Description:
-------------------------------------------------------
${complaint.description}
-------------------------------------------------------

Thank you for being a responsible citizen.
Smart Bharat Portal - Digitizing Civic Care.`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${complaint.tracking_id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaint();
  };

  // Admin function to simulate status cycles
  const handleUpdateStatus = async (newStatus) => {
    if (!complaint) return;
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`${API_BASE_URL}/complaints/${complaint.tracking_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Status update failed');
      const data = await response.json();
      setComplaint(data);
    } catch (err) {
      console.error(err);
      alert('Could not update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusSteps = ['submitted', 'in_review', 'in_progress', 'resolved'];
  
  const getStepIndex = (status) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Tracking ID search input */}
      <div className="premium-card-flat p-6">
        <h2 className="font-semibold text-lg font-display text-[#1B2430] mb-4">
          {t('track.title')}
        </h2>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder={t('track.placeholder')}
            aria-label="Complaint Tracking ID"
            className="premium-input font-mono font-bold text-[#0B4F6C] flex-grow"
          />
          <button
            type="submit"
            disabled={loading || !trackingId.trim()}
            className="btn-primary py-3 px-6 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            <span>{t('track.search')}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 text-[#B23A2E] rounded-xl text-xs border border-red-100">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Recent System Issues Fallback */}
      {!complaint && (
        <div className="bg-white rounded-2xl p-6 border border-[#E0DED7] shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-semibold text-xs text-[#8C95A0] uppercase tracking-wider border-b border-[#E0DED7] pb-3 flex items-center justify-between">
            <span>Recent System Issues</span>
            <span className="text-[10px] text-[#8C95A0] font-normal lowercase">Click ID to copy or Track to view</span>
          </h3>

          {recentList.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#5C6570]">
              No recent complaints registered.
            </div>
          ) : (
            <div className="divide-y divide-[#E0DED7]">
              {recentList.map((c) => (
                <div key={c.tracking_id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center gap-4 hover:bg-[#F7F6F2]/30 px-2 rounded-xl transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={(e) => handleCopy(c.tracking_id, e)}
                        className="font-mono text-xs font-bold text-[#0B4F6C] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-[#0B4F6C] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                        title="Click to copy Tracking ID"
                      >
                        <span>{c.tracking_id}</span>
                        <span className="text-[9px] text-blue-400 font-normal">
                          {copiedId === c.tracking_id ? '✓ copied' : 'copy'}
                        </span>
                      </button>
                      
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        c.urgency === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                        c.urgency === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                        'bg-blue-50 text-[#0B4F6C]'
                      }`}>
                        {t(`categories.${c.category}`)}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C6570] mt-1.5 line-clamp-1">{c.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setTrackingId(c.tracking_id);
                      fetchComplaint(c.tracking_id);
                    }}
                    className="px-3 py-1.5 bg-[#0B4F6C] hover:bg-[#07364b] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complaint detail card */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-[#E0DED7] shadow-sm overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#0B4F6C] text-white px-6 py-4 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap justify-between w-full sm:w-auto">
              <div>
                <span className="text-[10px] text-blue-200 block uppercase tracking-wider font-semibold">TRACKING ID</span>
                <span className="font-mono text-base font-bold tracking-wider">{complaint.tracking_id}</span>
              </div>
            </div>
            
            <button
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 hover:border-white/35 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <FileText size={14} />
              <span>Export Report</span>
            </button>
            <div className="flex gap-2">
              <span className="text-xs px-2.5 py-1 bg-white/10 rounded-md font-medium">
                {t(`categories.${complaint.category}`)}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                complaint.urgency === 'high' ? 'bg-red-500 text-white' :
                complaint.urgency === 'medium' ? 'bg-[#E08A2C] text-white' :
                'bg-[#2F7A4D] text-white'
              }`}>
                {t(`urgency.${complaint.urgency}`)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Stepper */}
            <div>
              <h3 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider mb-6">
                Complaint Status
              </h3>
              
              <div className="relative">
                {/* Connector line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#E0DED7] -z-10"></div>
                
                <div className="flex justify-between items-start text-center">
                  {statusSteps.map((stepName, index) => {
                    const activeIndex = getStepIndex(complaint.status);
                    const isCompleted = index <= activeIndex;
                    const isCurrent = index === activeIndex;
                    
                    return (
                      <div key={stepName} className="flex flex-col items-center flex-1 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-xs transition-all duration-300 z-10 ${
                          isCompleted
                            ? 'bg-[#2F7A4D] border-[#2F7A4D] text-white'
                            : 'bg-white border-[#C4C2BC] text-[#8C95A0]'
                        } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}>
                          {index + 1}
                        </div>
                        <span className={`text-xs mt-2 font-semibold ${
                          isCurrent ? 'text-[#0B4F6C]' : isCompleted ? 'text-[#2F7A4D]' : 'text-[#8C95A0]'
                        }`}>
                          {t(`track.status.${stepName}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <hr className="border-[#E0DED7]" />

            {/* Description and Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider">
                    User Description
                  </h4>
                  <p className="text-sm text-[#1B2430] mt-1.5 leading-relaxed bg-[#F7F6F2] p-3 rounded-xl border border-[#E0DED7] whitespace-pre-wrap">
                    {complaint.description}
                  </p>
                </div>

                <div className="flex gap-4 text-xs text-[#5C6570]">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-[#8C95A0]" />
                    <span><strong>Filed:</strong> {new Date(complaint.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-[#8C95A0]" />
                    <span><strong>Updated:</strong> {new Date(complaint.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {(() => {
                  const { photos: attachedPhotos, videos: attachedVideos } = parseAttachments(complaint.photo_url);
                  return (
                    <div className="space-y-4">
                      {/* Attached Photos */}
                      {attachedPhotos.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider mb-1.5 font-mono">
                            Attached Photos ({attachedPhotos.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {attachedPhotos.map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noreferrer" className="block max-w-[100px] border border-[#E0DED7] rounded-xl overflow-hidden hover:opacity-90 transition-all shadow-sm hover:scale-105">
                                <img src={url} alt={`Evidence ${idx}`} className="w-full h-16 object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attached Videos */}
                      {attachedVideos.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider mb-1.5 font-mono">
                            Attached Videos ({attachedVideos.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {attachedVideos.map((url, idx) => (
                              <video key={idx} src={url} controls className="max-w-[240px] rounded-xl border border-[#E0DED7] shadow-sm max-h-[140px] bg-black animate-fade-in" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Mini-map pin */}
              <div>
                <h4 className="text-xs font-semibold text-[#8C95A0] uppercase tracking-wider mb-2">
                  Complaint Location
                </h4>
                
                {complaint.latitude && complaint.longitude ? (
                  <div className="h-[180px] w-full rounded-xl overflow-hidden border border-[#E0DED7]">
                    <MapContainer
                      center={[complaint.latitude, complaint.longitude]}
                      zoom={15}
                      zoomControl={false}
                      scrollWheelZoom={false}
                      doubleClickZoom={false}
                      boxZoom={false}
                      dragging={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[complaint.latitude, complaint.longitude]} />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="border border-dashed border-[#E0DED7] rounded-xl py-12 text-center text-xs text-[#8C95A0]">
                    No location coordinates provided.
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Admin Console Panel */}
            <div className="bg-[#F7F6F2] rounded-xl p-4 border border-[#E0DED7] space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-[#0B4F6C] font-semibold uppercase tracking-wider">
                <UserCheck size={14} className="text-blue-500" />
                <span>Simulate Resolution Workflow (Admin Hack)</span>
              </div>
              <p className="text-[11px] text-[#5C6570]">
                As a developer evaluating this build, you can manually cycle this complaint status to test client-side updates instantly.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {statusSteps.map((step) => (
                  <button
                    key={step}
                    onClick={() => handleUpdateStatus(step)}
                    disabled={isUpdatingStatus || complaint.status === step}
                    className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-all cursor-pointer ${
                      complaint.status === step
                        ? 'bg-[#0B4F6C] border-[#0B4F6C] text-white shadow-sm'
                        : 'bg-white border-[#C4C2BC] text-[#5C6570] hover:bg-[#E0DED7]'
                    } disabled:opacity-50`}
                  >
                    Set: {t(`track.status.${step}`)}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
