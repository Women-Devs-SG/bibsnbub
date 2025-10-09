import { expect, test } from '@playwright/test';

test.describe('Middleware routing', () => {
  test.describe('Protected routing', () => {
    test('should redirect unauthed users to login', async () => {
      // 1. Simulate a request to the protected route
      const response = await fetch('http://localhost:3000/add', {
        headers: {
        // Ensure no session/auth cookie is sent
          Cookie: '',
        },
      });

      // 3. ASSERTION 2: Check the redirection target
      const locationHeader = response.headers.get('link');

      expect(locationHeader).toContain('/sign-in');
    });

    test('should allow access to public routes', async () => {
      const response = await fetch('http://localhost:3000/');

      expect(response.status).toBe(200);
    });
  });
});
