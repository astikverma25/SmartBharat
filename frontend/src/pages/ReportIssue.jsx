import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, AlertTriangle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon asset issue in Vite builds
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function ReportIssue({ t, language, prefilledText, setPage, addRecentComplaint }) {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState(prefilledText || '');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [category, setCategory] = useState('pothole');

  const getUrgencyForCategory = (cat) => {
    const mapping = {
      pothole: 'medium',
      garbage: 'low',
      streetlight: 'medium',
      water: 'high',
      electricity: 'high',
      other: 'low'
    };
    return mapping[cat] || 'low';
  };

  // Revoke Object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
      videos.forEach(v => URL.revokeObjectURL(v.preview));
    };
  }, []);
  const [latitude, setLatitude] = useState(28.6139); // Default to Delhi coordinates
  const [longitude, setLongitude] = useState(77.2090);
  const [locationName, setLocationName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [fileError, setFileError] = useState('');

  // Auto-focus description on step 1
  useEffect(() => {
    if (prefilledText) {
      setDescription(prefilledText);
    }
  }, [prefilledText]);

  // Request browser geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        // Reverse geocoding via Nominatim
        fetchLocationName(lat, lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not retrieve your location. Please pin manually on the map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchLocationName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'Smart-Bharat-Civic-Companion-Demo' } }
      );
      if (response.ok) {
        const data = await response.json();
        setLocationName(data.display_name || '');
      }
    } catch (err) {
      console.error('Nominatim geocode error:', err);
    }
  };

  const handleFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files);

    const incomingPhotos = files.filter(f => f.type.startsWith('image/'));
    const incomingVideos = files.filter(f => f.type.startsWith('video/'));
    const invalidFiles = files.filter(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));

    if (invalidFiles.length > 0) {
      setFileError('Invalid file format. Only images and videos are supported.');
      return;
    }

    if (photos.length + incomingPhotos.length > 5) {
      setFileError('Limit exceeded: You can upload up to 5 photos only.');
      return;
    }

    if (videos.length + incomingVideos.length > 2) {
      setFileError('Limit exceeded: You can upload up to 2 videos only.');
      return;
    }

    for (const f of incomingPhotos) {
      if (f.size > 5 * 1024 * 1024) {
        setFileError(`Image "${f.name}" exceeds the 5MB limit.`);
        return;
      }
    }

    for (const f of incomingVideos) {
      if (f.size > 50 * 1024 * 1024) {
        setFileError(`Video "${f.name}" exceeds the 50MB limit.`);
        return;
      }
    }

    const newPhotos = incomingPhotos.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    const newVideos = incomingVideos.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    setVideos(prev => [...prev, ...newVideos]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const removeVideo = (index) => {
    setVideos(prev => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleMapClick = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchLocationName(lat, lng);
  };

  // Map Event Handler to capture clicks and drags
  function MapEvents() {
    useMapEvents({
      click(e) {
        handleMapClick(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('category', category);
      formData.append('urgency', getUrgencyForCategory(category));
      // Append multiple photos
      photos.forEach(p => {
        formData.append('photos', p.file);
      });

      // Append multiple videos
      videos.forEach(v => {
        formData.append('videos', v.file);
      });

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to submit complaint');

      const data = await response.json();
      setSuccessData(data);
      
      // Save complaint details to recent items
      addRecentComplaint({
        tracking_id: data.complaint.tracking_id,
        description: data.complaint.description,
        category: data.complaint.category,
        urgency: data.complaint.urgency,
        created_at: data.complaint.created_at
      });

      setStep(3); // Success Screen
    } catch (err) {
      console.error(err);
      alert('Error submitting report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto premium-card-flat overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-[#0B4F6C] text-white px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-lg font-display">
          {t('report.title')}
        </h2>
        <span className="text-xs px-2 py-1 bg-[#1a6486] rounded font-mono">
          {step < 3 ? `STEP ${step} of 2` : 'COMPLETED'}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* STEP 1: DESCRIBE THE ISSUE */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label htmlFor="issue-description" className="block text-sm font-semibold text-[#1B2430] mb-2">
                {t('report.desc_step')}
              </label>
              <textarea
                id="issue-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('report.desc_placeholder')}
                rows={5}
                className="premium-input"
              />
            </div>

            {/* Category Dropdown & Auto Urgency */}
            <div className="space-y-2">
              <label htmlFor="issue-category" className="block text-xs font-semibold text-[#5C6570] flex justify-between items-center">
                <span>Select Issue Type (शिकायत का प्रकार)</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  getUrgencyForCategory(category) === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                  getUrgencyForCategory(category) === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                  'bg-blue-50 text-[#0B4F6C]'
                }`}>
                  Auto Priority: {getUrgencyForCategory(category).toUpperCase()}
                </span>
              </label>
              <select
                id="issue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="premium-input bg-white cursor-pointer"
              >
                <option value="pothole">Pothole / Road Damage (सड़क का गड्ढा)</option>
                <option value="garbage">Garbage / Sanitation (कचरा और गंदगी)</option>
                <option value="streetlight">Streetlight Fault (बिजली का खंभा / लाइट)</option>
                <option value="water">Water Leakage / Drainage (पानी का रिसाव / नाली)</option>
                <option value="electricity">Electricity / Loose Wire (बिजली का तार)</option>
                <option value="other">Other Civic Issues (अन्य समस्याएं)</option>
              </select>
            </div>

            {/* Single Upload Area */}
            <div className="space-y-3.5">
              <label className="block text-sm font-semibold text-[#1B2430]">
                Attach Evidence (Photos/Videos)
              </label>

              {fileError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-[#B23A2E] rounded-xl text-xs border border-red-100 animate-fade-in font-medium">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Single upload trigger box */}
              {(photos.length < 5 || videos.length < 2) && (
                <label className="border-2 border-dashed border-[#E5E3DC] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#0B4F6C] hover:bg-[#FBFBFA] transition-all group relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Camera size={32} className="text-[#C4C2BC] group-hover:text-[#0B4F6C] transition-colors mb-2" />
                  <span className="text-sm font-semibold text-[#0B4F6C] group-hover:underline">Click to attach media files</span>
                  <span className="text-xs text-[#8C95A0] mt-1 text-center font-mono">
                    Images up to 5MB (max 5) • Videos up to 50MB (max 2)
                  </span>
                </label>
              )}

              {/* Unified Previews Grid */}
              {(photos.length > 0 || videos.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                  {/* Photo Previews */}
                  {photos.map((p, idx) => (
                    <div key={`p-${idx}`} className="relative border border-[#E5E3DC] rounded-xl overflow-hidden bg-black h-16 flex items-center justify-center group shadow-sm animate-fade-in">
                      <img src={p.preview} alt={`Photo ${idx}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity duration-200 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}

                  {/* Video Previews */}
                  {videos.map((v, idx) => (
                    <div key={`v-${idx}`} className="relative border border-[#E5E3DC] rounded-xl overflow-hidden bg-black h-16 flex items-center justify-center group shadow-sm animate-fade-in">
                      <video src={v.preview} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none group-hover:hidden">
                        <span className="w-5 h-5 rounded-full bg-white/80 text-[10px] flex items-center justify-center font-bold text-[#0B4F6C]">▶</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(idx)}
                        className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity duration-200 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E5E3DC]">
              <button
                onClick={() => setStep(2)}
                disabled={!description.trim()}
                className="btn-primary cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <span>{t('report.location_step')}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION MAP */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-sm font-semibold text-[#1B2430]">
                  {t('report.location_step')}
                </label>
                <p className="text-xs text-[#8C95A0] mt-0.5">{t('report.location_desc')}</p>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#F7F6F2] hover:bg-[#E0DED7] text-[#0B4F6C] border border-[#E0DED7] rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isLocating ? <RefreshCw size={12} className="animate-spin" /> : <MapPin size={12} />}
                <span>{t('report.location_use_current')}</span>
              </button>
            </div>

            {/* Leaflet Map Frame */}
            <div className="h-[280px] w-full rounded-xl overflow-hidden shadow-inner border border-[#E0DED7] relative">
              <MapContainer 
                center={[latitude, longitude]} 
                zoom={13} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={[latitude, longitude]} 
                  draggable={true}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleMapClick(position.lat, position.lng);
                    },
                  }}
                />
                <MapEvents />
              </MapContainer>
            </div>

            {/* Geocode result location name */}
            {locationName && (
              <div className="flex items-start gap-1.5 p-3 bg-blue-50 text-[#0B4F6C] border border-blue-100 rounded-xl text-xs leading-relaxed">
                <MapPin size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
                <span><strong>Location Details:</strong> {locationName}</span>
              </div>
            )}

            {/* Accessibility Manual Coordinates Fallback */}
            <div>
              <button
                onClick={() => setShowManualCoords(!showManualCoords)}
                className="text-[11px] text-[#0B4F6C] hover:underline"
              >
                {showManualCoords ? 'Hide coordinates settings' : 'Enter coordinates manually (Accessibility fallback)'}
              </button>
              {showManualCoords && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-[#F7F6F2] rounded-lg border border-[#E0DED7] animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8C95A0]">LATITUDE</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => handleMapClick(parseFloat(e.target.value) || 0, longitude)}
                      className="w-full px-2 py-1 bg-white border border-[#E0DED7] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#8C95A0]">LONGITUDE</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => handleMapClick(latitude, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-white border border-[#E0DED7] rounded text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-[#E5E3DC]">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary py-3 px-5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{t('report.submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('report.submit')}</span>
                    <CheckCircle size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION SUCCESS */}
        {step === 3 && successData && (
          <div className="text-center py-6 space-y-6 animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2F7A4D] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-[#1B2430]">
                {t('report.success_title')}
              </h3>
              <p className="text-xs text-[#8C95A0]">Your grievance has been safely cataloged.</p>
            </div>

            {/* Tracking ID monospace card */}
            <div className="bg-[#F7F6F2] rounded-xl p-4 border border-[#E0DED7] inline-block shadow-inner">
              <span className="block text-[10px] text-[#8C95A0] tracking-wider uppercase font-semibold">
                {t('report.tracking_id')}
              </span>
              <span className="font-mono text-xl md:text-2xl font-bold text-[#0B4F6C] block mt-1 tracking-wider">
                {successData.complaint.tracking_id}
              </span>
            </div>

            {/* AI Classification visual feedback */}
            <div className="bg-white rounded-xl p-4 border border-[#E0DED7] max-w-md w-full text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1 bg-[#E08A2C]"></div>
              <p className="text-xs text-[#E08A2C] font-semibold uppercase tracking-wider">
                {t('report.ai_summary')}
              </p>
              
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-[#0B4F6C]">
                  {t(`categories.${successData.complaint.category}`)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  successData.complaint.urgency === 'high' ? 'bg-red-50 text-[#B23A2E]' :
                  successData.complaint.urgency === 'medium' ? 'bg-amber-50 text-[#E08A2C]' :
                  'bg-blue-50 text-[#0B4F6C]'
                }`}>
                  {t(`urgency.${successData.complaint.urgency}`)}
                </span>
              </div>
              
              <p className="text-sm text-[#5C6570] italic mt-3">
                🟠 Companion: "I've classified this issue as a {successData.complaint.category} with {successData.complaint.urgency} priority. You can track resolution live."
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full pt-4 border-t border-[#E5E3DC]">
              <button
                onClick={() => setPage('home')}
                className="btn-secondary py-2.5 px-5 cursor-pointer"
              >
                {t('report.back_home')}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('smart_bharat_last_track_id', successData.complaint.tracking_id);
                  setPage('track');
                }}
                className="btn-primary py-2.5 px-5 cursor-pointer"
              >
                {t('report.track_now')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
