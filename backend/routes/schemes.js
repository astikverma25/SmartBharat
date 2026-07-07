import express from 'express';
import { databaseService } from '../services/supabaseService.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// GET /api/schemes - List all schemes
router.get('/', async (req, res, next) => {
  try {
    const schemes = await databaseService.getSchemes();
    res.json(schemes);
  } catch (err) {
    next(err);
  }
});

// POST /api/schemes/recommend - Recommend schemes based on user profile
router.post('/recommend', async (req, res, next) => {
  try {
    const { age, occupation, income_bracket, state, gender, language = 'en' } = req.body;

    // Fetch schemes from database
    const allSchemes = await databaseService.getSchemes();

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const isGeminiConfigured = geminiApiKey && geminiApiKey !== 'dummy_gemini_api_key_replace_me';

    if (isGeminiConfigured) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `You are a public scheme recommender. Read this citizen profile and list of schemes.
Recommend the top 3-4 schemes that the citizen might be eligible for.
Provide the recommendations in ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.

Citizen Profile:
- Age: ${age || 'Not provided'}
- Occupation: ${occupation || 'Not provided'}
- Monthly Income Bracket: ${income_bracket || 'Not provided'}
- State: ${state || 'Not provided'}
- Gender: ${gender || 'Not provided'}

Schemes List:
${JSON.stringify(allSchemes.map(s => ({ id: s.id, name: s.name, category: s.category, eligibility: s.eligibility, eligibility_hi: s.eligibility_hi, description: s.description, description_hi: s.description_hi, official_url: s.official_url })))}

For each recommendation, explain in ONE concise sentence ("eligibility_reason") exactly why this scheme matches the citizen's profile.
If no direct eligibility matches are found, recommend the most general civic schemes (like Ayushman Bharat or PMGKAY) but note that they are general recommendations.

You MUST respond ONLY with a raw JSON array matching this schema:
[
  {
    "id": "scheme_id",
    "name": "Scheme Name in ${language === 'hi' ? 'Hindi' : 'English'}",
    "category": "scheme_category",
    "eligibility_reason": "Tailored reason why they qualify, in ${language === 'hi' ? 'Hindi' : 'English'}",
    "official_url": "official_scheme_url"
  }
]`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        });

        let cleaned = result.response.text().trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        const parsed = JSON.parse(cleaned.trim());

        return res.json(parsed);

      } catch (llmErr) {
        console.error('Gemini Scheme recommendation error, falling back to heuristics:', llmErr);
      }
    }

    // Heuristic Local Matching when Gemini is unavailable
    const recommendations = [];
    const occ = (occupation || '').toLowerCase();
    const inc = (income_bracket || '').toLowerCase();
    const ageVal = age ? parseInt(age) : null;

    // 1. PM-KISAN check
    if (occ.includes('farmer') || occ.includes('kisan') || occ.includes('किसान') || occ.includes('agriculture')) {
      const pmKisan = allSchemes.find(s => s.id === 's1');
      if (pmKisan) {
        recommendations.push({
          id: pmKisan.id,
          name: language === 'hi' ? 'पीएम-किसान (PRADHAN MANTRI KISAN SAMMAN NIDHI)' : pmKisan.name,
          category: pmKisan.category,
          eligibility_reason: language === 'hi' 
            ? 'यह आपके कृषि/किसान व्यवसाय से मेल खाता है।' 
            : 'Matches your agricultural/farming occupation.',
          official_url: pmKisan.official_url
        });
      }
    }

    // 2. Ayushman Bharat (generally recommended for lower brackets or elderly)
    const pmjay = allSchemes.find(s => s.id === 's2');
    if (pmjay) {
      const lowIncome = inc.includes('low') || inc.includes('<') || inc.includes('1.5') || inc.includes('2.5') || inc.includes('3') || inc.includes('गरीब') || inc.includes('कम');
      recommendations.push({
        id: pmjay.id,
        name: language === 'hi' ? 'आयुष्मान भारत (PM-JAY)' : pmjay.name,
        category: pmjay.category,
        eligibility_reason: language === 'hi'
          ? (lowIncome ? 'कम आय वर्ग के परिवारों के लिए स्वास्थ्य सुरक्षा प्रदान करता है।' : 'सामान्य स्वास्थ्य सुरक्षा योजना जो आर्थिक रूप से कमजोर वर्गों के लिए उपयोगी है।')
          : (lowIncome ? 'Provides health coverage support for lower income brackets.' : 'General health coverage support schema for eligible families.'),
        official_url: pmjay.official_url
      });
    }

    // 3. PMAY check
    const pmay = allSchemes.find(s => s.id === 's3');
    if (pmay && (inc.includes('low') || inc.includes('< 3') || inc.includes('1.5') || inc.includes('2.5') || inc.includes('3') || inc.includes('गरीब') || inc.includes('मध्यम'))) {
      recommendations.push({
        id: pmay.id,
        name: language === 'hi' ? 'प्रधानमंत्री आवास योजना (PMAY)' : pmay.name,
        category: pmay.category,
        eligibility_reason: language === 'hi'
          ? 'आपके कम/मध्यम आय वर्ग के आधार पर आवास सब्सिडी के लिए पात्र हो सकते हैं।'
          : 'You may qualify for housing subsidies based on your low/middle income bracket.',
        official_url: pmay.official_url
      });
    }

    // 4. PM-SYM check (Pension for unorganized workers aged 18-40)
    const pmsym = allSchemes.find(s => s.id === 's5');
    if (pmsym && ageVal && ageVal >= 18 && ageVal <= 40 && (occ.includes('worker') || occ.includes('labour') || occ.includes('shramik') || occ.includes('मजदूर') || occ.includes('नौकरी') || occ.includes('other') || occ === '')) {
      recommendations.push({
        id: pmsym.id,
        name: language === 'hi' ? 'प्रधानमंत्री श्रम योगी मान-धन (PM-SYM)' : pmsym.name,
        category: pmsym.category,
        eligibility_reason: language === 'hi'
          ? '18-40 वर्ष की आयु के असंगठित कामगारों के लिए वृद्धावस्था पेंशन सुरक्षा।'
          : 'Old-age pension security for unorganized workers aged between 18 and 40.',
        official_url: pmsym.official_url
      });
    }

    // 5. Scholarship check
    const scholarship = allSchemes.find(s => s.id === 's6');
    if (scholarship && ageVal && ageVal <= 30 && (occ.includes('student') || occ.includes('छात्र') || occ.includes('पढ़ाई'))) {
      recommendations.push({
        id: scholarship.id,
        name: language === 'hi' ? 'पोस्ट मैट्रिक छात्रवृत्ति योजना' : scholarship.name,
        category: scholarship.category,
        eligibility_reason: language === 'hi'
          ? 'यह छात्रवृत्ति उच्च शिक्षा प्राप्त कर रहे छात्रों के लिए उपलब्ध है।'
          : 'This scholarship is available for students pursuing post-matric/higher education.',
        official_url: scholarship.official_url
      });
    }

    // Guarantee at least 2 recommendations by adding general ones if empty
    if (recommendations.length < 2) {
      const pmgkay = allSchemes.find(s => s.id === 's4');
      if (pmgkay) {
        recommendations.push({
          id: pmgkay.id,
          name: language === 'hi' ? 'प्रधानमंत्री गरीब कल्याण अन्न योजना (PMGKAY)' : pmgkay.name,
          category: pmgkay.category,
          eligibility_reason: language === 'hi'
            ? 'खाद्यान्न सहायता के लिए राशन कार्ड धारकों हेतु सामान्य जनकल्याणकारी योजना।'
            : 'General welfare scheme for food grain support, available to ration card holders.',
          official_url: pmgkay.official_url
        });
      }
    }

    res.json(recommendations.slice(0, 4));

  } catch (err) {
    next(err);
  }
});

export default router;
