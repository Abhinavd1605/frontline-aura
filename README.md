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
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
PINECONE_API_KEY=...
PINECONE_INDEX=warehouse-index
GEMINI_API_KEY=...
PORT=8787
```

- Generate Prisma client after setting `DATABASE_URL`:
```
npx prisma generate
```

API endpoints:
- POST `/api/ingest` { documents: [{ id, text }] }
- POST `/api/query` { query, topK? }

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
