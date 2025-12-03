# Contributing to CommunityConnect

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/communityconnect.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Set up environment: Copy `.env.example` to `.env` and configure
6. Set up database: `npx prisma db push && npm run db:seed`

## Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following the code style
3. **Write tests** for new features
4. **Run tests**: `npm test`
5. **Run linter**: `npm run lint`
6. **Commit changes**: Use conventional commits
7. **Push to your fork**: `git push origin feature/your-feature-name`
8. **Open a Pull Request**

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use Prettier for formatting (if configured)
- Write self-documenting code with clear variable names
- Add JSDoc comments for complex functions

## Testing

- Write unit tests for utilities and helpers
- Write integration tests for API routes
- Aim for >80% code coverage
- Test edge cases and error scenarios

## Commit Messages

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add volunteer skill filtering`

## Pull Request Process

1. Update README.md if needed
2. Update CHANGELOG.md if applicable
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Questions?

Open an issue or contact maintainers.

