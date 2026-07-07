import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;

try {
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  console.log('Testing gemini-2.5-flash content generation...');
  const result = await model.generateContent('Hello!');
  console.log('Gemini Response:', result.response.text());
} catch (err) {
  console.error('Pro error:', err);
}
