import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from '../services/supabaseService.js';
import { llmService } from '../services/llmService.js';

const router = express.Router();

// Setup Multer for local uploads
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Allow up to 50MB at Multer level
});

// Helper: Generate tracking ID like SB-2026-081729
function generateTrackingId() {
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `SB-2026-${randNum}`;
}

// POST /api/complaints - File a new complaint
router.post('/', upload.fields([
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]), async (req, res, next) => {
  try {
    const { description, latitude, longitude, category: bodyCategory, urgency: bodyUrgency } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    let category = bodyCategory;
    let urgency = bodyUrgency;
    let aiClassification = null;

    if (!category || !urgency) {
      aiClassification = await llmService.classifyComplaint(description);
      category = category || aiClassification.category;
      urgency = urgency || aiClassification.urgency;
    }

    // Auto-generate tracking ID and UUID
    const id = uuidv4();
    const tracking_id = generateTrackingId();

    const uploadedPhotos = req.files && req.files['photos'] ? req.files['photos'] : [];
    const uploadedVideos = req.files && req.files['videos'] ? req.files['videos'] : [];
    const allFiles = [...uploadedPhotos, ...uploadedVideos];

    const cleanupFiles = (files) => {
      files.forEach(f => {
        try { fs.unlinkSync(f.path); } catch (e) {}
      });
    };

    // Validate photos
    for (const file of uploadedPhotos) {
      if (!file.mimetype.startsWith('image/')) {
        cleanupFiles(allFiles);
        return res.status(400).json({ error: `File "${file.originalname}" is not a valid image format.` });
      }
      if (file.size > 5 * 1024 * 1024) {
        cleanupFiles(allFiles);
        return res.status(400).json({ error: `Image "${file.originalname}" exceeds the 5MB size limit.` });
      }
    }

    // Validate videos
    for (const file of uploadedVideos) {
      if (!file.mimetype.startsWith('video/')) {
        cleanupFiles(allFiles);
        return res.status(400).json({ error: `File "${file.originalname}" is not a valid video format.` });
      }
      if (file.size > 50 * 1024 * 1024) {
        cleanupFiles(allFiles);
        return res.status(400).json({ error: `Video "${file.originalname}" exceeds the 50MB size limit.` });
      }
    }

    const photoUrls = [];
    const videoUrls = [];

    // Upload photos
    for (const file of uploadedPhotos) {
      let url = null;
      if (databaseService.isUsingSupabase()) {
        try {
          url = await databaseService.uploadMedia(file);
          try { fs.unlinkSync(file.path); } catch (e) {}
        } catch (storageErr) {
          console.error('Supabase storage photo upload failed, saving locally:', storageErr);
          url = `/uploads/${file.filename}`;
        }
      } else {
        url = `/uploads/${file.filename}`;
      }
      photoUrls.push(url);
    }

    // Upload videos
    for (const file of uploadedVideos) {
      let url = null;
      if (databaseService.isUsingSupabase()) {
        try {
          url = await databaseService.uploadMedia(file);
          try { fs.unlinkSync(file.path); } catch (e) {}
        } catch (storageErr) {
          console.error('Supabase storage video upload failed, saving locally:', storageErr);
          url = `/uploads/${file.filename}`;
        }
      } else {
        url = `/uploads/${file.filename}`;
      }
      videoUrls.push(url);
    }

    const photo_url = JSON.stringify({
      photos: photoUrls,
      videos: videoUrls
    });

    const complaintData = {
      id,
      tracking_id,
      description,
      category,
      urgency,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      photo_url,
      status: 'submitted'
    };

    const saved = await databaseService.saveComplaint(complaintData);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint: saved,
      ai_summary: aiClassification ? aiClassification.summary : `User reported ${category} issue.`,
      confidence: aiClassification ? aiClassification.confidence : 1.0
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/complaints - Get all complaints (Admin/Debug view)
router.get('/', async (req, res, next) => {
  try {
    const complaints = await databaseService.getAllComplaints();
    res.json(complaints);
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints/:trackingId - Track a complaint by ID
router.get('/:trackingId', async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const complaint = await databaseService.getComplaintByTrackingId(trackingId);

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found with this tracking ID' });
    }

    res.json(complaint);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/complaints/:trackingId - Update status (Admin function)
router.patch('/:trackingId', async (req, res, next) => {
  try {
    const { trackingId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['submitted', 'in_review', 'in_progress', 'resolved'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + allowedStatuses.join(', ') });
    }

    const updated = await databaseService.updateComplaintStatus(trackingId, status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
