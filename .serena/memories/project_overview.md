# Next-YUI Project Overview

## Project Purpose
Next-YUI is a Next.js 15-based AI chat application featuring real-time conversations with "YUI", a 16-year-old Japanese AI assistant. The application provides a terminal-style UI with typewriter effects, lip-sync avatar animation, and smart auto-scrolling.

## Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **AI Engine**: Google Gemini 2.5 Flash with @google/genai SDK v1.15.0
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Real-time Communication**: Socket.IO (development) / HTTP API (production)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Code Quality**: Biome for linting and formatting

## Key Architecture Patterns

### Dual Communication System
- Development: Uses Socket.IO for real-time communication (server.js)
- Production: Uses HTTP API endpoints (/api/chat)
- Client automatically switches based on environment via `createChatClient()`

### AI Session Management
- Each user gets a unique sessionId mapped to individual Gemini Chat instances
- Maintains conversation history automatically using @google/genai chats API
- Dual implementation: `gemini.ts` (ES modules) + `gemini-server.js` (CommonJS for Socket.IO)

### Authentication & Security
- NextAuth.js with Google OAuth
- Email whitelist enforcement via ALLOWED_EMAILS environment variable
- Middleware protects all routes except /auth/* and /api/auth/*
- robots: 'noindex, nofollow' for privacy

## Main Components
- **YuiChat.tsx**: Main chat interface with smart auto-scroll and keyboard shortcuts
- **TypewriterText.tsx**: Character-by-character text animation with sound effects
- **chat-client.ts**: Environment-aware client switching (Socket.IO/HTTP)
- **useTypewriter.ts**: Custom hook for typewriter animation with callback system
- **CommandManager**: Slash commands system (/clear, /help)

## Project Structure
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/` - React components with complex state management
- `/src/lib/` - Core business logic and API integration
- `/src/hooks/` - Custom React hooks for animations and sound
- `/server.js` - Custom server combining Next.js + Socket.IO
- `/docs/` - Comprehensive design documentation