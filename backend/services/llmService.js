import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const isGeminiConfigured = geminiApiKey && geminiApiKey !== 'dummy_gemini_api_key_replace_me';

let model = null;
if (isGeminiConfigured) {
  console.log('Gemini API key detected. Initializing Gemini Client...');
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    // Using gemini-2.5-flash for speed and structured outputs
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Gemini model initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API:', error);
  }
} else {
  console.log('No valid Gemini API key. Backend will run in LOCAL MOCK AI mode.');
}

// Helper to clean JSON string if Gemini outputs markdown code blocks
function cleanJsonString(str) {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// -------------------------------------------------------------
// LOCAL MOCK AI HEURISTICS (for zero-config local testing)
// -------------------------------------------------------------
function getMockChatResponse(message, language = 'en') {
  const msg = message.toLowerCase();
  
  // Detect if message is Devanagari Hindi
  const isHindiText = /[\u0900-\u097F]/.test(message);
  
  // Detect Hinglish (transliterated Hindi) by looking for common Hinglish vocabulary
  const hinglishKeywords = ['kaise', 'kya', 'chahiye', 'muje', 'mujhe', 'mera', 'meri', 'hai', 'hoga', 'kab', 'kaha', 'kahan', 'karne', 'karna', 'gaddhe', 'gadda', 'sadak', 'paani', 'bijli', 'shikayat', 'namaste', 'aap', 'kaun'];
  const isHinglishText = hinglishKeywords.some(kw => msg.includes(kw));

  let detectedLang = language;
  if (isHindiText) {
    detectedLang = 'hi';
  } else if (isHinglishText) {
    detectedLang = 'hinglish';
  }

  let intent = 'general_query';
  let response = '';
  let confidence = 0.95;

  if (detectedLang === 'hi') {
    if (msg.includes('पासपोर्ट') || msg.includes('passport') || msg.includes('दस्तावेज़') || msg.includes('document')) {
      intent = 'document_requirement';
      response = 'पासपोर्ट के लिए आपको पहचान प्रमाण (जैसे आधार कार्ड, पैन कार्ड), पते का प्रमाण (जैसे बिजली बिल, बैंक स्टेटमेंट) और जन्म तिथि का प्रमाण चाहिए। आप पोस्ट ऑफिस या पासपोर्ट सेवा केंद्र पर आवेदन कर सकते हैं। अधिक जानकारी के लिए "दस्तावेज़" (Documents) वाले विकल्प पर जाएं।';
    } else if (msg.includes('राशन') || msg.includes('ration') || msg.includes('अनाज')) {
      intent = 'document_requirement';
      response = 'नया राशन कार्ड प्राप्त करने के लिए आपको परिवार के मुखिया का आधार कार्ड, आय प्रमाण पत्र और परिवार के सदस्यों की समूह फोटो की आवश्यकता होगी। इसे खाद्य विभाग के कार्यालय या जन सेवा केंद्र (CSC) में जमा करें।';
    } else if (msg.includes('किसान') || msg.includes('kisan') || msg.includes('खेती') || msg.includes('योजना') || msg.includes('scheme')) {
      intent = 'scheme_recommendation';
      response = 'किसानों के लिए प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) योजना उपलब्ध है, जिसमें सरकार सालाना ₹6,000 की वित्तीय सहायता देती है। इसके अलावा, आप "योजनाएं" (Schemes) अनुभाग में जाकर अपनी पात्रता जांच सकते हैं।';
    } else if (msg.includes('शिकायत') || msg.includes('complaint') || msg.includes('गड्ढा') || msg.includes('सड़क') || msg.includes('बिजली') || msg.includes('कचरा')) {
      intent = 'complaint_intent';
      response = 'ऐसा लगता है कि आप अपने क्षेत्र की किसी समस्या की शिकायत दर्ज करना चाहते हैं। आप शीर्ष नेविगेशन में "मुद्दा रिपोर्ट करें" (Report Issue) पर क्लिक करके आसानी से शिकायत दर्ज कर सकते हैं, जहां आप फोटो भी जोड़ सकते हैं।';
    } else {
      response = 'नमस्ते! मैं स्मार्ट भारत नागरिक सहायक हूँ। मैं आपको सरकारी योजनाओं, दस्तावेज़ चेकलिस्ट खोजने और नागरिक शिकायतें दर्ज करने में मदद कर सकता हूँ। आप मुझसे हिंदी या अंग्रेजी में कुछ भी पूछ सकते हैं!';
    }
  } else if (detectedLang === 'hinglish') {
    if (msg.includes('passport') || msg.includes('document') || msg.includes('checklist')) {
      intent = 'document_requirement';
      response = 'Passport ke liye aapko ID proof (jaise Aadhaar, PAN card), address proof (jaise utility bill, bank statement) aur birth proof ki zaroorat hogi. Aap online apply karke Passport Seva Kendra ja sakte hain. Adhik jankari ke liye "Checklist" page par check karein.';
    } else if (msg.includes('ration') || msg.includes('card')) {
      intent = 'document_requirement';
      response = 'Naya Ration Card banwane ke liye aapko family head ka Aadhaar card, income certificate aur family photograph chahiye hoga. Isko aap local food office ya CSC center par submit kar sakte hain.';
    } else if (msg.includes('kisan') || msg.includes('scheme') || msg.includes('farmer') || msg.includes('kheti')) {
      intent = 'scheme_recommendation';
      response = 'Kisanon ke liye government ki "PM-KISAN" scheme hai jisme saal ke Rs. 6000 milte hain. Baki schemes aur eligibility dekhne ke liye hamare "Explore Schemes" page par apna profile fill karein.';
    } else if (msg.includes('complaint') || msg.includes('shikayat') || msg.includes('sadak') || msg.includes('gadda') || msg.includes('gaddhe') || msg.includes('paani') || msg.includes('bijli')) {
      intent = 'complaint_intent';
      response = 'Aisa lagta hai ki aap apne area ki kisi problem ki shikayat darj karna chahte hain. Aap menu bar me "Report Issue" par click karke map aur photo ke sath direct shikayat file kar sakte hain.';
    } else {
      response = 'Namaste! Main aapka Smart Bharat Companion hoon. Main aapko sarkari yojnayein dhoondhne, zaroori documents check karne aur complaints register karne me help kar sakta hoon. Aap mujhse kisi bhi bhasha me sawaal pooch sakte hain!';
    }
  } else {
    // English
    if (msg.includes('passport') || msg.includes('document') || msg.includes('checklist')) {
      intent = 'document_requirement';
      response = 'For a passport application, you generally require Proof of Identity (Aadhaar/PAN/Voter ID), Proof of Address (Utility bill, Bank statement), and Proof of Date of Birth (Birth certificate/10th marksheet). You can apply online and visit a Passport Seva Kendra. Go to the Documents Checklist module for a dynamic checklist.';
    } else if (msg.includes('ration') || msg.includes('card')) {
      intent = 'document_requirement';
      response = 'To apply for a new Ration Card, you will need Aadhaar cards of all family members, a family group photograph, and an Income Certificate. Applications can be submitted at the local Food and Civil Supplies office or Citizen Service Centers (CSC).';
    } else if (msg.includes('kisan') || msg.includes('scheme') || msg.includes('farmer') || msg.includes('agriculture')) {
      intent = 'scheme_recommendation';
      response = 'For farmers, the government offers PM-KISAN which provides income support of ₹6,000/year. You may also check your eligibility for other schemes under our Schemes section by filling out a quick profile.';
    } else if (msg.includes('complaint') || msg.includes('report') || msg.includes('pothole') || msg.includes('garbage') || msg.includes('street') || msg.includes('water')) {
      intent = 'complaint_intent';
      response = 'It looks like you want to report a civic issue. Please navigate to the "Report an Issue" page in the menu. There, you can upload a photo and mark the exact location on a map so municipal authorities can resolve it.';
    } else {
      response = 'Hello! I am your Smart Bharat Civic Companion. I am here to help you navigate government schemes, find required documents for services, and file civic complaints. Feel free to ask me anything!';
    }
  }

  return { intent, response, confidence };
}

function getMockComplaintClassification(description) {
  const text = description.toLowerCase();
  let category = 'other';
  let urgency = 'medium';
  let summary = description.substring(0, 80) + (description.length > 80 ? '...' : '');

  if (text.includes('pothole') || text.includes('road') || text.includes('gadda') || text.includes('सड़क') || text.includes('गड्ढा')) {
    category = 'pothole';
    urgency = text.includes('accident') || text.includes('danger') || text.includes('big') || text.includes('accident') ? 'high' : 'medium';
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('dustbin') || text.includes('kachra') || text.includes('कूड़ा') || text.includes('गंदगी')) {
    category = 'garbage';
    urgency = text.includes('smell') || text.includes('disease') ? 'medium' : 'low';
  } else if (text.includes('streetlight') || text.includes('street light') || text.includes('dark') || text.includes('khamba') || text.includes('बिजली का खंभा') || text.includes('लाइट')) {
    category = 'streetlight';
    urgency = text.includes('night') || text.includes('theft') || text.includes('safety') ? 'high' : 'medium';
  } else if (text.includes('water') || text.includes('leak') || text.includes('sewage') || text.includes('drain') || text.includes('पानी') || text.includes('नाली')) {
    category = 'water';
    urgency = text.includes('flood') || text.includes('drinking') || text.includes('dirty') ? 'high' : 'medium';
  } else if (text.includes('electricity') || text.includes('power') || text.includes('wire') || text.includes('current') || text.includes('करंट') || text.includes('तार')) {
    category = 'electricity';
    urgency = text.includes('spark') || text.includes('wire broken') || text.includes('touching') ? 'high' : 'medium';
  }

  return {
    category,
    urgency,
    summary,
    confidence: 0.92
  };
}

// -------------------------------------------------------------
// EXPORTED SERVICES
// -------------------------------------------------------------
export const llmService = {
  isUsingGemini() {
    return !!model;
  },

  // 1. Detect Chat Intent and respond
  async detectIntentAndRespond(message, history = [], language = 'en') {
    if (!model) {
      // Return mock response
      const mockRes = getMockChatResponse(message, language);
      return {
        ...mockRes,
        aiMode: 'offline'
      };
    }

    try {
      // Build history context for LLM prompt
      const historyContext = history
        .map(h => `${h.role === 'user' ? 'Citizen' : 'AI Companion'}: ${h.content}`)
        .join('\n');

      const systemPrompt = `You are "Companion" (साथी), the warm, empathetic, yet official AI civic assistant of "Smart Bharat". 
Your goal is to help citizens understand government schemes, extract document requirements, and report civic issues.

Language Instructions:
1. Detect the language/style of the Latest Citizen Message (English, Devanagari Hindi, or Hinglish - Hindi words written in English/Latin letters).
2. Respond in the EXACT SAME language style used by the citizen.
   - If they write in Devanagari Hindi, answer in Devanagari Hindi.
   - If they write in Hinglish (e.g., "aap kaise ho", "mujhe passport chahiye"), answer in warm, natural Hinglish.
   - If they write in English, answer in English.

Guidelines:
1. Simplify complex processes. Keep explanations at an 8th-grade reading level.
2. If the user query is about a specific scheme or service, cite its name clearly.
3. If you are not confident about the information (or it goes outside standard common schemes like passport, Aadhaar, ration card, PAN, driving license, PM-KISAN, Ayushman Bharat, PMAY), show a fallback note in the matching language style:
   - For English: "I am not fully sure - please verify this information on the official government portal."
   - For Hindi (Devanagari): "मैं पूरी तरह से आश्वस्त नहीं हूँ - कृपया संबंधित आधिकारिक पोर्टल पर इसकी पुष्टि करें।"
   - For Hinglish: "Mujhe iski pakki jankari nahi hai - kripya official government portal par check karein."
4. Determine the intent of the citizen's message. Select exactly ONE intent from this list:
   - 'general_query': general greetings, civic queries, general navigation.
   - 'scheme_recommendation': user asking which scheme they are eligible for, or describing their profile to match schemes.
   - 'document_requirement': user asking what documents they need for a service (e.g. passport, Aadhaar).
   - 'complaint_intent': user describing a local physical issue (broken light, pothole) or expressing desire to file a complaint.

Format your output as a raw JSON object (and nothing else) containing:
{
  "intent": "detected_intent_here",
  "response": "your_helpful_simplified_response_text_here",
  "confidence": 0.xx
}`;

      const userPrompt = `Conversation History:\n${historyContext}\n\nLatest Citizen Message: "${message}"\n\nPlease detect intent and respond.`;

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const text = cleanJsonString(result.response.text());
      const parsed = JSON.parse(text);
      return {
        intent: parsed.intent || 'general_query',
        response: parsed.response || '',
        confidence: parsed.confidence || 0.8,
        aiMode: 'gemini'
      };

    } catch (err) {
      console.error('Gemini detectIntentAndRespond Error, falling back to Mock:', err);
      const mockRes = getMockChatResponse(message, language);
      return {
        ...mockRes,
        aiMode: 'mock',
        error: err.message
      };
    }
  },

  // 2. Classify civic complaint text into category and urgency (structured JSON)
  async classifyComplaint(description) {
    if (!model) {
      const mockClassify = getMockComplaintClassification(description);
      return {
        ...mockClassify,
        aiMode: 'offline'
      };
    }

    try {
      const systemPrompt = `You are a civic complaint classifier. Your job is to read a citizen's complaint description and categorize it and assign an urgency level.
Categories allowed: 'pothole', 'garbage', 'streetlight', 'water', 'electricity', 'other'.
Urgency levels: 'low', 'medium', 'high'.

Rules for Urgency:
- 'high': Safety hazards (dangling wires, open deep manholes, broken streetlights causing complete darkness in crime-prone areas, massive water main burst flooding roads, dangerous potholes on high-speed roads).
- 'medium': Major inconvenience but not immediate physical danger (normal pothole, localized garbage pile, street light out on minor street, water pressure low, leaking pipe).
- 'low': Minor issues (scattered litter, small weeds, slow drain).

You MUST respond ONLY with a raw JSON object matching this schema:
{
  "category": "selected_category",
  "urgency": "selected_urgency",
  "summary": "one_sentence_concise_english_summary_of_the_complaint",
  "confidence": 0.xx
}`;

      const userPrompt = `Complaint Description: "${description}"`;

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const text = cleanJsonString(result.response.text());
      const parsed = JSON.parse(text);
      return {
        category: parsed.category || 'other',
        urgency: parsed.urgency || 'medium',
        summary: parsed.summary || description.substring(0, 100),
        confidence: parsed.confidence || 0.8,
        aiMode: 'gemini'
      };

    } catch (err) {
      console.error('Gemini classifyComplaint Error, falling back to Mock:', err);
      const mockClassify = getMockComplaintClassification(description);
      return {
        ...mockClassify,
        aiMode: 'mock',
        error: err.message
      };
    }
  }
};
