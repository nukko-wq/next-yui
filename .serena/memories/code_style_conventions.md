# Code Style and Conventions

## Linting and Formatting
- **Tool**: Biome (configured in biome.json)
- **Commands**: 
  - `npm run lint` - Check code quality
  - `npm run format` - Auto-format code

## TypeScript Conventions
- Strict TypeScript configuration (tsconfig.json)
- Use interface over type for object definitions
- Proper type exports from shared modules
- No any types - use proper typing

## Component Conventions
- Use functional components with hooks
- Export components as default exports
- Use descriptive component names (PascalCase)
- Props interfaces defined inline or separately

## File Naming
- Components: PascalCase (e.g., YuiChat.tsx, TypewriterText.tsx)
- Hooks: camelCase with "use" prefix (e.g., useTypewriter.ts)
- Utilities: camelCase (e.g., chat-client.ts, gemini.ts)
- Types: PascalCase for interfaces, camelCase for files

## Import/Export Patterns
- Group imports: external libraries, then internal modules
- Use named exports for utilities and hooks
- Default exports for React components
- Barrel exports in index.ts files where appropriate

## React Patterns
- Use useCallback for event handlers to prevent re-renders
- Use useMemo for expensive calculations
- Proper cleanup in useEffect hooks
- Custom hooks for reusable stateful logic

## State Management
- Local state with useState for component-specific data
- Context for shared state across components
- Proper state typing with TypeScript

## Error Handling
- Try-catch blocks for async operations
- Proper error typing and handling
- User-friendly error messages

## Comment Style
- JSDoc comments for functions and complex logic
- Inline comments for clarification when needed
- Avoid obvious comments that don't add value