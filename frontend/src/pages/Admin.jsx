import React, { useState, useEffect } from 'react';
import { Shield, Search, FileText, CheckCircle, Clock, AlertTriangle, AlertCircle, Eye, ArrowRight, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { API_BASE_URL } from '../config.js';

export default function Admin({ t }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Selected complaint details modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Status values
  const statuses = ['submitted', 'in_review', 'in_progress', 'resolved'];

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`);
      if (!res.ok) throw new Error('Failed to load complaints');
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve complaints from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (trackingId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/${trackingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      
      // Update local state list
      setComplaints(prev => prev.map(c => 
        c.tracking_id === trackingId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
      ));

      // Update selected modal view if active
      if (selectedComplaint && selectedComplaint.tracking_id === trackingId) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update status.');
    }
  };

  // Helper: check if file is video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExts = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime', '.avi'];
    const lowerUrl = url.toLowerCase();
    return videoExts.some(ext => lowerUrl.includes(ext) || lowerUrl.endsWith(ext));
  };

  // Helper: parse attachments JSON
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
        console.error('Failed to parse attachments:', e);
      }
    }
    const isVideo = isVideoUrl(photoUrl);
    return {
      photos: isVideo ? [] : [photoUrl],
      videos: isVideo ? [photoUrl] : []
    };
  };

  // Filter complaints based on search query and selections
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.tracking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesUrgency = filterUrgency === 'all' || c.urgency === filterUrgency;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesUrgency && matchesStatus;
  });

  // Calculate live stats from loaded dataset
  const countByStatus = (status) => complaints.filter(c => c.status === status).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      
      {/* Title Header */}
      <div className="premium-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1.5 bg-[#0B4F6C]"></div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-[#0B4F6C]" />
            <h2 className="text-xl md:text-2xl font-display font-bold text-[#1B2430]">
              Municipal Command Center
            </h2>
          </div>
          <p className="text-xs text-[#8C95A0]">
            Review public reports, inspect media attachments, coordinate status updates, and update citizen dashboards.
          </p>
        </div>
      </div>

      {/* Live Counter Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E0DED7] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-[#8C95A0] font-bold uppercase tracking-wider">Submitted</span>
            <span className="font-mono text-xl font-extrabold text-[#1B2430]">{countByStatus('submitted')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0DED7] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-[#8C95A0] font-bold uppercase tracking-wider">In Review</span>
            <span className="font-mono text-xl font-extrabold text-[#1B2430]">{countByStatus('in_review')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0DED7] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-[#8C95A0] font-bold uppercase tracking-wider">In Progress</span>
            <span className="font-mono text-xl font-extrabold text-[#1B2430]">{countByStatus('in_progress')}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E0DED7] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="block text-[10px] text-[#8C95A0] font-bold uppercase tracking-wider">Resolved</span>
            <span className="font-mono text-xl font-extrabold text-[#1B2430]">{countByStatus('resolved')}</span>
          </div>
        </div>
      </div>

      {/* Main Panel Controls */}
      <div className="premium-card p-6 space-y-6">
        
        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#5C6570] mb-1.5">Search Query</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID / Description..."
                className="premium-input py-1.5 pl-8 text-xs bg-[#F7F6F2]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C95A0]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C6570] mb-1.5">Filter Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="premium-input py-1.5 text-xs bg-[#F7F6F2] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Potholes</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlights</option>
              <option value="water">Water / Drainage</option>
              <option value="electricity">Electricity</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C6570] mb-1.5">Filter Urgency</label>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="premium-input py-1.5 text-xs bg-[#F7F6F2] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5C6570] mb-1.5">Filter Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="premium-input py-1.5 text-xs bg-[#F7F6F2] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        {loading ? (
          <div className="text-center py-12 text-[#5C6570] text-sm">
            <RefreshCw size={24} className="animate-spin mx-auto text-[#0B4F6C] mb-2" />
            <span>Loading complaints list...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 text-sm flex flex-col items-center gap-2">
            <AlertCircle size={32} />
            <p>{error}</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-12 text-[#5C6570] text-sm">
            <AlertCircle size={28} className="mx-auto text-[#C4C2BC] mb-2" />
            <p>No complaints found matching selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#E0DED7] rounded-xl shadow-sm">
            <table className="w-full text-left text-xs divide-y divide-[#E0DED7]">
              <thead className="bg-[#F7F6F2] text-[#5C6570] font-semibold">
                <tr>
                  <th className="px-4 py-3">Tracking ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Set Status</th>
                  <th className="px-4 py-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0DED7] bg-white font-medium text-[#1B2430]">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#0B4F6C] font-semibold">{c.tracking_id}</td>
                    <td className="px-4 py-3 capitalize">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.urgency === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                        c.urgency === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                        'bg-blue-50 text-[#0B4F6C]'
                      }`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5C6570]">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        c.status === 'resolved' ? 'bg-green-50 text-[#2F7A4D]' :
                        c.status === 'in_progress' ? 'bg-yellow-50 text-[#C19B1A]' :
                        c.status === 'in_review' ? 'bg-blue-50 text-[#0B4F6C]' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleUpdateStatus(c.tracking_id, e.target.value)}
                        className="border border-[#E0DED7] rounded-lg px-2 py-1 text-[10px] bg-[#F7F6F2] font-semibold cursor-pointer outline-none focus:border-[#0B4F6C]"
                      >
                        {statuses.map(st => (
                          <option key={st} value={st}>{st.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0B4F6C] hover:bg-[#07364b] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        <Eye size={12} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complaint Inspection Modal overlay */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E0DED7] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#0B4F6C] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-blue-200 block uppercase tracking-wider font-semibold">Inspection Console</span>
                <span className="font-mono text-base font-bold tracking-wider">{selectedComplaint.tracking_id}</span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Close Console
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-grow">
              
              {/* Top details columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider">Classification</h4>
                  <p className="text-sm font-semibold capitalize text-[#1B2430] mt-1">{selectedComplaint.category}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider">Priority</h4>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${
                    selectedComplaint.urgency === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                    selectedComplaint.urgency === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                    'bg-blue-50 text-[#0B4F6C]'
                  }`}>
                    {selectedComplaint.urgency}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider">Workflow Stage</h4>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={selectedComplaint.status}
                      onChange={(e) => handleUpdateStatus(selectedComplaint.tracking_id, e.target.value)}
                      className="border border-[#E0DED7] rounded-lg px-2.5 py-1 text-xs bg-[#F7F6F2] font-semibold cursor-pointer outline-none"
                    >
                      {statuses.map(st => (
                        <option key={st} value={st}>{st.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <hr className="border-[#E0DED7]" />

              {/* Description & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider">Citizen Description</h4>
                    <p className="text-sm text-[#1B2430] mt-2 leading-relaxed bg-[#F7F6F2] p-4 rounded-xl border border-[#E0DED7] whitespace-pre-wrap">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  {/* Media attachments */}
                  {selectedComplaint.photo_url && (
                    <div>
                      <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider mb-2">Attached Evidence</h4>
                      {(() => {
                        const { photos: attachedPhotos, videos: attachedVideos } = parseAttachments(selectedComplaint.photo_url);
                        return (
                          <div className="space-y-3">
                            {attachedPhotos.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {attachedPhotos.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="block max-w-[120px] border border-[#E0DED7] rounded-xl overflow-hidden hover:opacity-90 transition-all shadow-sm">
                                    <img src={url} alt={`Evidence ${idx}`} className="w-full h-16 object-cover" />
                                  </a>
                                ))}
                              </div>
                            )}
                            {attachedVideos.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {attachedVideos.map((url, idx) => (
                                  <video key={idx} src={url} controls className="max-w-[240px] rounded-xl border border-[#E0DED7] shadow-sm max-h-[120px] bg-black" />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Map */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#8C95A0] uppercase tracking-wider mb-2">Report Coordinates</h4>
                  {selectedComplaint.latitude && selectedComplaint.longitude ? (
                    <div className="h-[220px] rounded-xl overflow-hidden border border-[#E0DED7] relative">
                      <MapContainer 
                        center={[selectedComplaint.latitude, selectedComplaint.longitude]} 
                        zoom={15} 
                        scrollWheelZoom={false} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[selectedComplaint.latitude, selectedComplaint.longitude]} />
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-[220px] rounded-xl border border-dashed border-[#E0DED7] flex items-center justify-center text-xs text-[#8C95A0]">
                      No coordinates provided
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
