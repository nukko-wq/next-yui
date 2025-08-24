# Suggested Development Commands

## Development Server
- `npm run dev` - Start development server with Socket.IO support (custom server.js) [Primary development command]
- `npm run dev:next` - Start standard Next.js dev server without Socket.IO
- `npm run build` - Build the application using Turbopack
- `npm run start` - Start production Next.js server
- `npm run start:custom` - Start production with custom Socket.IO server

## Code Quality
- `npm run lint` - Run Biome linter and checker [Run after completing tasks]
- `npm run format` - Format code with Biome [Run after completing tasks]

## System Commands (Linux)
- `ls` - List directory contents
- `cd` - Change directory
- `grep` - Search text patterns in files
- `find` - Find files and directories
- `git` - Version control operations

## Task Completion Checklist
After completing any development task:
1. `npm run lint` - Check for linting issues
2. `npm run format` - Format code consistently
3. Test the application with `npm run dev`
4. Verify functionality in both development and production builds

## Environment Setup Required
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