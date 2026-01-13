# Testing Guide

## Overview
This document describes how to run tests locally and in CI for the MAOS Sales Agent App.

## Test Structure

### Unit Tests
- **Location:** `__tests__/`
- **Framework:** Jest + React Testing Library
- **Coverage:** Utilities, helpers, and component logic

### Integration Tests
- **Location:** `__tests__/smoke/`
- **Framework:** Jest + React Testing Library
- **Coverage:** Component interactions and state management

### End-to-End Tests
- **Location:** `e2e/`
- **Framework:** Playwright
- **Coverage:** Critical user workflows

## Running Tests Locally

### Prerequisites
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run E2E Tests with UI
```bash
npm run test:e2e:ui
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `test` | Run all tests (Jest + Playwright) |
| `test:unit` | Run Jest unit tests only |
| `test:e2e` | Run Playwright e2e tests |
| `test:watch` | Run Jest in watch mode |
| `test:coverage` | Run Jest with coverage report |
| `test:e2e:ui` | Run Playwright with UI mode |

## CI/CD Integration

### Netlify
The project is configured for Netlify deployment. Tests run automatically on:
- Pull requests
- Commits to main branch

### Test Configuration
- **Jest Config:** `jest.config.js`
- **Playwright Config:** `playwright.config.ts`
- **CI:** Tests run headless in CI environment

## Writing Tests

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Integration Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useAction } from '../lib/action-helper';

describe('Action Helper', () => {
  it('handles async operations', async () => {
    const { execute, loading } = useAction({
      component: 'Test',
      action: 'TestAction',
    });
    
    await execute(async () => {
      return 'success';
    });
    
    expect(loading).toBe(false);
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/home');
  await expect(page.locator('h1')).toContainText('MAOS');
});
```

## Test Coverage Goals

- **Unit Tests:** >80% coverage for utilities and helpers
- **Component Tests:** All interactive components have at least one test
- **E2E Tests:** All critical workflows covered

## Debugging Tests

### Jest
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright
```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug
```

## Common Issues

### Tests Failing in CI
- Ensure all async operations are properly awaited
- Check for timeouts (increase if needed)
- Verify environment variables are set

### Playwright Timeouts
- Increase timeout in `playwright.config.ts`
- Check for slow network requests
- Verify selectors are correct

## Best Practices

1. **Isolate Tests:** Each test should be independent
2. **Mock External Dependencies:** Use mocks for API calls
3. **Test User Behavior:** Focus on what users see and do
4. **Keep Tests Fast:** Avoid unnecessary waits
5. **Clear Test Names:** Describe what is being tested

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/docs/intro)
