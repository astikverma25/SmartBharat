import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { llmService } from '../services/llmService.js';
import { databaseService } from '../services/supabaseService.js';

const router = express.Router();

// POST /api/chat - Chat with companion and detect intent
router.post('/', async (req, res, next) => {
  try {
    const { message, history = [], language = 'en', sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message field is required' });
    }

    const activeSessionId = sessionId || uuidv4();

    // Call LLM Service
    const aiResult = await llmService.detectIntentAndRespond(message, history, language);

    // Construct new message history
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    const aiMsg = { role: 'assistant', content: aiResult.response, intent: aiResult.intent, timestamp: new Date().toISOString() };
    const updatedHistory = [...history, userMsg, aiMsg];

    // Maintain only the last 10 messages in database to save space, but PRD asks for last 5 context messages
    // Let's store the whole history, but client can pass last 5.
    await databaseService.saveChatSession(activeSessionId, updatedHistory, language);

    res.json({
      sessionId: activeSessionId,
      intent: aiResult.intent,
      response: aiResult.response,
      confidence: aiResult.confidence,
      aiMode: aiResult.aiMode,
      error: aiResult.error || null,
      history: updatedHistory
    });

  } catch (err) {
    next(err);
  }
});

// GET /api/chat/:sessionId - Retrieve chat history
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await databaseService.getChatSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
});

export default router;
