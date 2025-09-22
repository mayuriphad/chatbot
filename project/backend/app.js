// Enhanced General Purpose Chatbot Backend
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(s => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: origin not allowed'), false);
    }
  }
}));
app.use(express.json());

// Try to load generative client safely
let genAI = null;
let model = null;
const API_KEY = process.env.GEMINI_API_KEY || process.env.GENAI_API_KEY || process.env.GOOGLE_API_KEY;

try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    if (typeof genAI.getGenerativeModel === 'function') {
      model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
    } else {
      model = genAI;
    }
    console.log('✅ Generative AI client initialized successfully');
  } else {
    console.warn('⚠️  WARNING: GEMINI_API_KEY / GENAI_API_KEY environment variable not set!');
    console.warn('   Please add your Gemini API key to the .env file');
  }
} catch (err) {
  console.warn('❌ Generative AI client not available or failed to load:', err.message);
}

// Enhanced system prompt for general-purpose assistant
const SYSTEM_PROMPT = `
You are MEDI-ASSIST, an AI medical chatbot. 
Your job is to take user symptoms and give:

1. **Possible Conditions** – list likely illnesses (not diagnosis).  
2. **Risk Level** – Mild, Moderate, or Serious.  
3. **Precautions** – simple steps the user can take at home.  
4. **Next Steps** – when to see a doctor, and if urgent, tell them to seek immediate help.  
5. **Q&A** – answer health questions in clear, simple words.  

⚠️ Important Rules:
- Keep answers short, clear, and helpful.  
- Always remind users to consult a real doctor.  
- If symptoms are emergency-like (chest pain, breathing issues, heavy bleeding, unconsciousness), tell them to seek urgent medical help right away.  
`
+ `
Remember: You're here to be genuinely helpful across all domains of human knowledge and experience!`;

// Helper to extract text from multiple possible response shapes
function extractText(result) {
  if (!result) return null;
  return result?.response?.candidates?.[0]?.content?.parts?.[0]?.text
    || result?.output?.[0]?.content?.[0]?.text
    || result?.outputText
    || result?.text
    || (typeof result === 'string' ? result : null);
}

// Rate limiting storage (simple in-memory for demo)
const rateLimitStore = {
  requests: [],
  lastReset: Date.now()
};

// Check rate limits (15 requests per minute for free tier)
function checkRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000; // 1 minute in milliseconds

  // Reset counter every hour
  if (now - rateLimitStore.lastReset > 3600000) { // 1 hour
    rateLimitStore.requests = [];
    rateLimitStore.lastReset = now;
  }

  // Remove requests older than 1 minute
  rateLimitStore.requests = rateLimitStore.requests.filter(time => time > oneMinuteAgo);

  // Check if we're under the limit (conservative: 10 per minute)
  if (rateLimitStore.requests.length >= 10) {
    const oldestRequest = Math.min(...rateLimitStore.requests);
    const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
  }

  // Record this request
  rateLimitStore.requests.push(now);
}

// Enhanced chat generation helper
async function generateReply(userMessage, conversationHistory = []) {
  if (!model && !genAI) {
    throw new Error('Generative AI service not configured. Please check your API key.');
  }

  // Check rate limits before making API call
  checkRateLimit();

  // Build comprehensive conversation context
  let context = SYSTEM_PROMPT + '\n\n';

  // Add conversation history for context (last 6 messages for better context)
  if (conversationHistory && Array.isArray(conversationHistory)) {
    context += '**Conversation History:**\n';
    conversationHistory.slice(-6).forEach((msg, index) => {
      const role = msg.role || (msg.isUser ? 'User' : 'Assistant') || 'User';
      const text = msg.text || msg.message || '';
      context += `${role}: ${text}\n`;
    });
    context += '\n';
  }

  context += `**Current Question:**\nUser: ${userMessage}\n\nAssistant: `;

  let result;
  try {
    if (model && typeof model.generateContent === 'function') {
      result = await model.generateContent(context);
    } else if (genAI && typeof genAI.generate === 'function') {
      result = await genAI.generate({
        model: 'gemini-1.5-flash',
        input: context,
        temperature: 0.7
      });
    } else if (genAI && typeof genAI.create === 'function') {
      result = await genAI.create({
        model: 'gemini-1.5-flash',
        prompt: context,
        temperature: 0.7
      });
    } else if (model && typeof model.generate === 'function') {
      result = await model.generate(context);
    } else {
      throw new Error('No supported generation method available on the AI client');
    }

    const aiResponse = extractText(result);
    if (!aiResponse) {
      console.error('Full generation result:', result);
      throw new Error('No text response from Generative AI');
    }

    return aiResponse.trim();
  } catch (error) {
    console.error('Generation error:', error);

    // Handle quota exceeded errors specifically
    if (error.message.includes('Quota exceeded')) {
      const retryMatch = error.message.match(/retry in (\d+(?:\.\d+)?)s/);
      const waitTime = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
      throw new Error(`API quota exceeded. Please wait ${waitTime} seconds and try again. Consider using shorter messages to reduce token usage.`);
    }

    if (error.message.includes('Rate limit')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }

    throw new Error('Failed to generate response: ' + error.message);
  }
}

// Enhanced chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string',
        code: 'INVALID_MESSAGE'
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: 'Message too long. Please limit to 4000 characters.',
        code: 'MESSAGE_TOO_LONG'
      });
    }

    const response = await generateReply(message, conversationHistory);

    res.json({
      response,
      timestamp: new Date().toISOString(),
      messageId: Date.now().toString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);

    let errorMessage = "I'm having trouble processing your request right now. Please try again in a moment.";
    let errorCode = 'INTERNAL_ERROR';

    if (error.message.includes('API key')) {
      errorMessage = "AI service configuration issue. Please contact support.";
      errorCode = 'CONFIG_ERROR';
    } else if (error.message.includes('rate limit')) {
      errorMessage = "I'm getting a lot of requests right now. Please wait a moment and try again.";
      errorCode = 'RATE_LIMIT';
    }

    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint with more details
app.get('/api/health', (req, res) => {
  const isAIConfigured = !!(model || genAI);
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'GENA - General Purpose AI Assistant',
    version: '2.0.0',
    ai_service: isAIConfigured ? 'Connected' : 'Not Configured',
    capabilities: [
      'General Q&A',
      'Problem Solving',
      'Creative Writing',
      'Technical Help',
      'Educational Support',
      'Conversation'
    ]
  });
});

// Usage monitoring endpoint
app.get('/api/usage', (req, res) => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentRequests = rateLimitStore.requests.filter(time => time > oneMinuteAgo);

  res.json({
    requests_last_minute: recentRequests.length,
    total_requests_today: rateLimitStore.requests.length,
    rate_limit_status: recentRequests.length < 10 ? 'OK' : 'APPROACHING_LIMIT',
    next_reset: new Date(rateLimitStore.lastReset + 3600000).toISOString(),
    recommendations: [
      recentRequests.length > 8 ? 'Slow down requests' : 'Rate limit OK',
      'Use Gemini Flash for better quota efficiency',
      'Keep messages concise to reduce token usage'
    ]
  });
});

// Get bot info endpoint
app.get('/api/bot-info', (req, res) => {
  res.json({
    name: 'GENA',
    version: '2.0.0',
    description: 'General Purpose AI Assistant',
    capabilities: [
      'Answer questions on any topic',
      'Provide explanations and tutorials',
      'Help with problem-solving',
      'Assist with creative writing',
      'Offer educational support',
      'Engage in meaningful conversation'
    ],
    limitations: [
      'Cannot browse the internet for real-time information',
      'Knowledge cutoff may apply to very recent events',
      'Cannot perform actions outside of conversation',
      'Should not replace professional advice for medical/legal/financial matters'
    ],
    last_updated: new Date().toISOString()
  });
});

// Create HTTP server and Socket.IO for realtime messages
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Enhanced Socket.IO handling
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.emit('bot_ready', {
    message: 'GENA is ready to help!',
    capabilities: ['General Q&A', 'Problem Solving', 'Creative Writing', 'Technical Help'],
    timestamp: new Date().toISOString()
  });

  socket.on('send_message', async (payload) => {
    try {
      const { message, conversationHistory, userId } = payload || {};

      if (!message || typeof message !== 'string') {
        return socket.emit('error_message', {
          error: 'Message is required and must be a string',
          code: 'INVALID_MESSAGE'
        });
      }

      if (message.length > 4000) {
        return socket.emit('error_message', {
          error: 'Message too long. Please limit to 4000 characters.',
          code: 'MESSAGE_TOO_LONG'
        });
      }

      // Emit typing indicator
      socket.emit('typing_start');

      const reply = await generateReply(message, conversationHistory);

      socket.emit('typing_end');
      socket.emit('receive_message', {
        response: reply,
        timestamp: new Date().toISOString(),
        messageId: Date.now().toString(),
        status: 'success'
      });

    } catch (err) {
      console.error('❌ Realtime generation error:', err);
      socket.emit('typing_end');

      let errorMessage = 'Failed to generate response. Please try again.';
      if (err.message.includes('API key')) {
        errorMessage = 'AI service configuration issue. Please contact support.';
      }

      socket.emit('error_message', {
        error: errorMessage,
        code: 'GENERATION_ERROR'
      });
    }
  });

  socket.on('ping_bot', () => {
    socket.emit('pong_bot', { timestamp: new Date().toISOString() });
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', socket.id, reason);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    available_endpoints: ['/api/chat', '/api/health', '/api/bot-info']
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🤖 GENA - General Purpose AI Assistant`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`ℹ️  Bot info: http://localhost:${PORT}/api/bot-info`);
  console.log(`⚡ WebSocket support enabled`);
  console.log(`🔑 AI Service: ${(model || genAI) ? '✅ Connected' : '❌ Not Configured'}`);
});

module.exports = { app, server };