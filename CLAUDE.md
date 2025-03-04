# Development Guide for ForumMagnum

## Build/Lint/Test Commands
- Development: `npm run dev` or `yarn dev` (with turbopack)
- Legacy dev: `npm run dev-legacy` or `yarn dev-legacy`
- Build: `npm run build` or `yarn build`
- Lint: `npm run lint` or `yarn lint`
- Type check: `yarn tsc` (in lesswrong directory)
- Run unit tests: `yarn unit` (in lesswrong directory)
- Run single unit test: `yarn unit -t "test name pattern"`
- Integration tests: `yarn integration` (in lesswrong directory)
- E2E tests: `yarn playwright-test` (in lesswrong directory)

## Code Style Guidelines
- **TypeScript**: Use strict typing with proper interfaces for props
- **Components**: Use functional components with hooks
- **Naming**: 
  - PascalCase for components (e.g., `TopPostsPage.tsx`)
  - camelCase for hooks with 'use' prefix (e.g., `useCurrentUser`)
  - camelCase for utilities and variables
  - Event handlers prefixed with 'handle' (e.g., `handleToggleExpand`)
- **Imports**: Group by external libraries first, then internal modules
- **Formatting**: Follow Next.js/Eslint standards, zero tolerance for warnings
- **Error handling**: Use proper TypeScript error types, avoid silent fails
- **File organization**: Follow Next.js app directory structure

## Project Structure
- Next.js app directory for new components
- Legacy code in lesswrong/ directory
- Path aliasing with `@/` prefix for importing from lesswrong package