// ...existing code...
# Medical Chatbot Application (Google Generative AI / Gemini)

A medical information chatbot built with React frontend and a Node.js backend that uses Google's Generative AI (Gemini) via the @google/generative-ai client. The app provides general health information and symptom guidance for educational purposes only.

## ⚠️ Medical Disclaimer

This application is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns and seek emergency care if symptoms are life‑threatening.

## Project Structure

```
project/
├── frontend/                    # React + Vite frontend
├── backend/                     # Node.js + Express backend (uses Google Generative AI)
└── README.md
```

## Key points

- AI backend uses Google Generative AI (Gemini) via the @google/generative-ai package.
- Typical model used: gemini-1.5-flash (configurable in backend).
- Realtime messaging supported via Socket.IO (optional).
- All responses include a medical disclaimer and emergency guidance when appropriate.

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Google Generative AI API key with appropriate quota and billing enabled

## Environment variables (backend/.env)

Do NOT commit your .env. Store secrets securely.

Required:
- GOOGLE_API_KEY=your_google_api_key_here

Optional fallbacks:
- GEMINI_API_KEY=...
- GENAI_API_KEY=...

Other:
- PORT=3001
- ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
- NODE_ENV=development

## Backend setup

1. Open a terminal and go to backend:
```bash
cd project/backend
```

2. Install dependencies:
```bash
npm install
# if you use realtime:
npm install socket.io
# Google client:
npm install @google/generative-ai
```

3. Create .env from template and add your GOOGLE_API_KEY:
```bash
cp .env.example .env
# then edit .env and set GOOGLE_API_KEY
```

4. Start backend (development):
```bash
npm run dev
# or
nodemon app.js
```

Notes:
- Ensure Google Generative Language API is enabled for your project and billing/quota are configured.
- If you hit rate limits, request quota increases in Google Cloud Console or implement client-side rate limiting / exponential backoff (backend includes retry logic).

## Frontend setup

1. Open a terminal and go to frontend:
```bash
cd project/frontend
```

2. Install and run:
```bash
npm install
npm run dev
```

3. Frontend runs on Vite (default http://localhost:5173). Vite is configured to proxy /api to the backend (see vite.config.ts).

4. If using realtime chat UI, install socket.io-client:
```bash
npm install socket.io-client
```
and open a Socket.IO connection to the backend, emit "send_message" and listen for "receive_message" / "error_message".

## API Endpoints

- POST /api/chat
  - Body: { message: string, conversationHistory?: array }
  - Returns: { response: string, timestamp: string }

- GET /api/health
  - Basic health/status check

- WebSocket (optional)
  - connect → emit "send_message" with { message, conversationHistory }
  - listen for "receive_message" and "error_message"

## Configuration notes

- Model selection (e.g., gemini-1.5-flash) is configured in backend/app.js where the @google/generative-ai client is initialized.
- Keep system prompt conservative and safety-focused (the backend includes an enhanced medical system prompt by default).
- Do not hardcode API keys in source. Use environment variables.

## Rate limits and retries

- Google Generative AI enforces per‑project and per‑region quotas. If you encounter 429 errors, enable exponential backoff and respect Retry‑After headers. See Google Cloud quotas page for increasing limits.

## Security & Privacy

- Do not store or log sensitive personal health information in plaintext.
- Do not commit .env or API keys to source control.
- Use HTTPS / secure configuration for production.

## Troubleshooting

- "Generative AI service not configured": make sure GOOGLE_API_KEY is set and loaded by the backend.
- 429 / quota errors: enable billing, reduce request frequency, or request quota increase at cloud.google.com.
- socket.io module missing: run npm install socket.io in backend.

## Deployment

- Set environment variables in your host/CI system (DO NOT include secrets in repo).
- Use process managers (PM2, systemd) and reverse proxy (Nginx) for production.
- Ensure CORS origins are set to your frontend domain.

## Acknowledgements

- Google Generative AI (Gemini)
- React, Vite, Tailwind (frontend)
- Express and Socket.IO (backend)

## License

MIT

// ...existing code...