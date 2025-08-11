# Frontline AI — Liquid Glass Interface

A modern web application that empowers frontline workers with a liquid glass interface, 3D warehouse visualization, and conversational assistance.

## Features

- **3D Workplace Visualization**: Interactive 3D warehouse and workplace visualization
- **AI Chat Interface**: Conversational assistance for frontline teams
- **Modern UI**: Built with shadcn-ui components and Tailwind CSS
- **Responsive Design**: Works seamlessly across all devices

## Technologies Used

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics library
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd frontline-aura
```

2. Install dependencies:
```bash
npm install
# if using Supabase: set DATABASE_URL in .env
```

3. Start the development server:
```bash
npm run dev:full
```
## Backend configuration

Environment variables (create `.env` at the repo root):

```
DATABASE_URL=postgresql://<user>:<password>@<host>:6543/postgres?schema=public   # Supabase pooled (pgbouncer)
DIRECT_URL=postgresql://<user>:<password>@<host>:5432/postgres?schema=public     # Supabase direct (non-pooled)
PINECONE_API_KEY=...
PINECONE_INDEX=warehouse-index
GEMINI_API_KEY=...
PORT=8787
# TTS (Deepgram)
DEEPGRAM_API_KEY=
DEEPGRAM_MODEL=aura-asteria-en
DEEPGRAM_ENCODING=mp3   # mp3 | wav
```

- Generate Prisma client after setting `DATABASE_URL`:
```
npx prisma generate
```

If you need to apply schema changes in Supabase:
```
# For production: apply migrations generated elsewhere
npm run db:migrate

# For development: push current schema directly (no migration files)
npm run db:push
```

API endpoints:
- POST `/api/ingest` { documents: [{ id, text }] }
- POST `/api/query` { query, topK? }
- POST `/api/tts` { text, provider?: 'piper'|'azure', voice?, format?: 'mp3'|'wav' }
### TTS setup

Option A: Piper (local, open-source)
- Run a Piper container that exposes POST /api/tts. For example (community images vary):
```
docker run -p 5500:5000 -e PIPER_VOICE=en_US-amy-medium ghcr.io/rhasspy/piper-http:latest
```
- Set `PIPER_TTS_URL=http://localhost:5500/api/tts`

Option B: Azure Speech (free tier available)
- Set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` and optional `AZURE_SPEECH_VOICE=en-US-AriaNeural`
- Request POST /api/tts with `{ provider: 'azure' }`

4. Open your browser and navigate to `http://localhost:8080`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
└── main.tsx       # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
