# Task Completion Checklist

## After Every Development Task

### 1. Code Quality Checks (Required)
- [ ] `npm run lint` - Run Biome linter to check for issues
- [ ] `npm run format` - Format code with Biome
- [ ] Fix any linting errors or warnings before proceeding

### 2. Functionality Testing
- [ ] `npm run dev` - Test in development mode with Socket.IO
- [ ] Verify the feature works as expected in the browser
- [ ] Test both desktop and mobile responsive behavior (if UI changes)

### 3. Build Verification
- [ ] `npm run build` - Ensure production build succeeds
- [ ] No TypeScript errors or build failures

### 4. Authentication Flow (if auth-related changes)
- [ ] Test login/logout functionality
- [ ] Verify email whitelist enforcement
- [ ] Check protected route behavior

### 5. AI Integration (if AI-related changes) 
- [ ] Test conversation flow and history
- [ ] Verify session management works correctly
- [ ] Check both Socket.IO and HTTP API modes

### 6. Slash Commands (if command-related changes)
- [ ] Test command parsing and execution
- [ ] Verify command suggestions UI behavior
- [ ] Test keyboard navigation (Tab, Enter, Escape)

## Before Git Commit
- [ ] All tests pass
- [ ] Code is properly formatted
- [ ] No console errors in browser
- [ ] Feature is fully functional
- [ ] Documentation updated if necessary

## Specific Component Testing
### YuiChat Component
- [ ] Message sending and receiving works
- [ ] Auto-scroll behavior is correct
- [ ] Keyboard shortcuts (Ctrl+K) function
- [ ] Avatar animation syncs with responses

### Command System
- [ ] Command detection and execution
- [ ] Suggestion dropdown appears and filters correctly
- [ ] Tab completion works
- [ ] Enter execution works