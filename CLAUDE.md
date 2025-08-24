# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**
- `npm run dev` - Start development server with Socket.IO support (custom server.js)
- `npm run dev:next` - Start standard Next.js dev server without Socket.IO
- `npm run build` - Build the application using Turbopack
- `npm run start` - Start production Next.js server
- `npm run start:custom` - Start production with custom Socket.IO server

**Code Quality:**
- `npm run lint` - Run Biome linter and checker
- `npm run format` - Format code with Biome

## Architecture Overview

This is a Next.js 15 AI chat application with a dual-client architecture and sophisticated AI integration.

### Dual Communication Architecture

**Development vs Production:**
- Development: Uses Socket.IO for real-time communication (`server.js`)
- Production: Uses HTTP API for requests (`/api/chat`)
- Client automatically switches based on environment via `createChatClient()`

**Key Pattern:**
```typescript
// chat-client.ts implements ChatClient interface
interface ChatClient {
  connect(): Promise<void>
  sendMessage(message: string): Promise<void>
  clearSession(): Promise<void>
}

// Auto-selects implementation:
// - SocketIOClient (development)  
// - HTTPClient (production)
```

### AI Integration Pattern

**Session Management:**
- Each user gets a unique sessionId
- Sessions map to individual Gemini Chat instances: `Map<string, Chat>`
- Maintains conversation history automatically using `@google/genai` chats API
- Two implementations: `gemini.ts` (TypeScript) and `gemini-server.js` (CommonJS for Socket.IO)

**Multi-turn Conversations:**
```typescript
// Creates persistent chat instances per session
const chat = genAI.chats.create({
  model: 'gemini-2.5-flash',
  config: { systemInstruction: YUI_PERSONA }
})

// Automatically maintains history
await chat.sendMessage({ message: userInput })
const history = chat.getHistory()
```

### Authentication Architecture

**Restricted Access Pattern:**
- NextAuth.js with Google OAuth
- Email whitelist enforcement via `ALLOWED_EMAILS` environment variable
- Middleware protects all routes except `/auth/*` and `/api/auth/*`
- Session validation on every request

### UI/UX Patterns

**Smart Auto-Scroll System:**
- Detects user scrolling vs. automated scrolling
- Different behaviors for AI typing vs. normal chat
- Uses `isUserScrolling`, `isBotTyping`, and `isFarFromBottom()` states

**Typewriter Effect with Real-time Scroll:**
- `useTypewriter` hook provides character-by-character display
- `onTextChange` callback triggers auto-scroll during AI responses
- Lip-sync animation synchronized with typing

**Terminal Aesthetic:**
- Green-on-black theme with monospace fonts
- Retro command-line interface styling
- Avatar with mouth animation during AI responses

## Key Components

**YuiChat.tsx** - Main chat component with comprehensive state management:
- Message history, connection status, avatar state
- Smart scrolling logic with multiple user behavior detection
- Keyboard shortcuts (Ctrl+K for clear)
- Integration with both Socket.IO and HTTP clients

**TypewriterText.tsx** + **useTypewriter.ts** - Character animation system:
- Configurable delay and sound effects
- Callback system for scroll synchronization
- Manages completion states for UI updates

**Dual Gemini Clients:**
- `gemini.ts` - Modern ES modules for API routes
- `gemini-server.js` - CommonJS for Socket.IO server compatibility

## Environment Variables Required

```bash
# Authentication (Required)
AUTH_SECRET=                 # NextAuth.js secret
AUTH_GOOGLE_ID=             # Google OAuth client ID  
AUTH_GOOGLE_SECRET=         # Google OAuth client secret
ALLOWED_EMAILS=             # Comma-separated whitelist

# AI Integration (Required)
GEMINI_API_KEY=             # Google Gemini API key

# Optional
NODE_ENV=                   # development/production
PORT=                       # Server port (default: 3000)
```

## Project Structure Context

- `/src/app/` - Next.js 15 App Router pages and API routes
- `/src/components/` - React components with complex state management
- `/src/lib/` - Core business logic and API integration
- `/src/hooks/` - Custom React hooks for animations and sound
- `/server.js` - Custom server combining Next.js + Socket.IO
- `/docs/` - Comprehensive design documentation

## Development Notes

**Socket.IO Development Server:**
The custom server.js combines Next.js with Socket.IO for development. The Socket.IO integration is only active in development mode and provides real-time communication for testing the chat experience.

**AI Persona Configuration:**
YUI's personality is defined in `GeminiConfig.SYSTEM_INSTRUCTION` with detailed Japanese persona settings. The AI is configured as a 16-year-old friendly assistant with specific speaking patterns and interests.

**Session Lifecycle:**
Sessions are created per user and persist until explicitly cleared. The `/clear` command and Ctrl+K both trigger session cleanup, which deletes the Chat instance and conversation history.