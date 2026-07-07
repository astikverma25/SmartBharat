import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDataPath = path.join(__dirname, '..', 'data', 'schemes_documents.json');

// Read curated documents checklist
function getCuratedChecklists() {
  if (fs.existsSync(seedDataPath)) {
    const rawData = fs.readFileSync(seedDataPath, 'utf8');
    return JSON.parse(rawData).documents;
  }
  return [];
}

// POST /api/documents/lookup - Get document checklist for a goal
router.post('/lookup', async (req, res, next) => {
  try {
    const { goal, language = 'en' } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal description is required' });
    }

    const cleanGoal = goal.toLowerCase();
    const curated = getCuratedChecklists();

    // Check if we can find a match in our curated list
    let matchedService = null;
    
    // Simple keyword mapping
    if (cleanGoal.includes('passport') || cleanGoal.includes('पासपोर्ट')) {
      matchedService = curated.find(d => d.service.toLowerCase().includes('passport'));
    } else if (cleanGoal.includes('aadhaar') || cleanGoal.includes('आधार') || cleanGoal.includes('adhar')) {
      matchedService = curated.find(d => d.service.toLowerCase().includes('aadhaar'));
    } else if (cleanGoal.includes('ration') || cleanGoal.includes('राशन') || cleanGoal.includes('rashan')) {
      matchedService = curated.find(d => d.service.toLowerCase().includes('ration'));
    } else if (cleanGoal.includes('pan') || cleanGoal.includes('पैन') || cleanGoal.includes('pancard')) {
      matchedService = curated.find(d => d.service.toLowerCase().includes('pan'));
    } else if (cleanGoal.includes('license') || cleanGoal.includes('driving') || cleanGoal.includes('लाइसेंस') || cleanGoal.includes('ड्राइविंग')) {
      matchedService = curated.find(d => d.service.toLowerCase().includes('driving'));
    }

    // If matched, format response in the requested language
    if (matchedService) {
      const responsePayload = {
        service: language === 'hi' ? matchedService.service_hi : matchedService.service,
        description: language === 'hi' ? matchedService.description_hi : matchedService.description,
        checklist: matchedService.checklist.map(c => ({
          name: language === 'hi' ? c.name_hi : c.name,
          options: c.options,
          format: c.format
        })),
        submission_location: language === 'hi' ? matchedService.submission_location_hi : matchedService.submission_location,
        processing_time: language === 'hi' ? matchedService.processing_time_hi : matchedService.processing_time,
        official_url: matchedService.official_url,
        unverified: false
      };
      return res.json(responsePayload);
    }

    // If not matched in curated data, use LLM to construct a checklist
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const isGeminiConfigured = geminiApiKey && geminiApiKey !== 'dummy_gemini_api_key_replace_me';

    if (isGeminiConfigured) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `You are a helpful government service checklist assistant.
The citizen wants a document checklist to achieve this goal: "${goal}".
This service is NOT in our standard curated database, so we must answer from general knowledge and flag it as unverified.
Provide the response in ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.

You MUST respond ONLY with a raw JSON object matching this schema:
{
  "service": "Official Name of the Service in ${language === 'hi' ? 'Hindi' : 'English'}",
  "description": "Brief description of the service in ${language === 'hi' ? 'Hindi' : 'English'}",
  "checklist": [
    {
      "name": "Checklist Item Title (e.g. Identity Proof) in ${language === 'hi' ? 'Hindi' : 'English'}",
      "options": ["Aadhaar Card", "Voter ID Card"],
      "format": "e.g. Original and Photocopy in ${language === 'hi' ? 'Hindi' : 'English'}"
    }
  ],
  "submission_location": "Where to submit (e.g. RTO Office) in ${language === 'hi' ? 'Hindi' : 'English'}",
  "processing_time": "Estimated processing time in ${language === 'hi' ? 'Hindi' : 'English'}",
  "official_url": "Search URL or official portal if known, otherwise empty string"
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        });

        let cleaned = result.response.text().trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        const parsed = JSON.parse(cleaned.trim());

        // Force unverified flag
        parsed.unverified = true;
        return res.json(parsed);

      } catch (llmErr) {
        console.error('LLM Document checklist lookup error, falling back to mock warning:', llmErr);
      }
    }

    // Static fallback if not matched and LLM fails/disabled
    const fallbackPayload = {
      service: language === 'hi' ? 'अज्ञात सेवा' : 'Unknown Service',
      description: language === 'hi' 
        ? `हम "${goal}" के लिए सटीक दस्तावेज़ों की सूची नहीं ढूंढ पाए।` 
        : `We couldn't find a precise document checklist for "${goal}".`,
      checklist: [
        {
          name: language === 'hi' ? 'सामान्य पहचान पत्र' : 'General Identity Proof',
          options: ['Aadhaar Card', 'PAN Card', 'Voter ID'],
          format: language === 'hi' ? 'मूल और फोटोकॉपी' : 'Original & Photocopy'
        },
        {
          name: language === 'hi' ? 'सामान्य पते का प्रमाण' : 'General Address Proof',
          options: ['Aadhaar Card', 'Electricity Bill', 'Bank Passbook'],
          format: language === 'hi' ? 'फोटोकॉपी' : 'Photocopy'
        }
      ],
      submission_location: language === 'hi' ? 'निकटतम नागरिक सेवा केंद्र (CSC)' : 'Nearest Citizen Service Centre (CSC)',
      processing_time: language === 'hi' ? 'सत्यापित नहीं' : 'Not verified',
      official_url: '',
      unverified: true
    };

    res.json(fallbackPayload);

  } catch (err) {
    next(err);
  }
});

export default router;
