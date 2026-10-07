import {
  isTokenExpired,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from './token-storage.js';

describe('token-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('isTokenExpired', () => {
    it('should return false for token without exp field', () => {
      // Header.Payload.Signature où Payload n'a pas de exp
      const payload = btoa(JSON.stringify({ sub: '123' })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return false for valid (non-expired) token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ exp: futureTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = btoa(JSON.stringify({ exp: pastTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('not.a.token')).toBe(true);
      expect(isTokenExpired('invalid')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });
  });

  describe('getStoredToken', () => {
    it('should return null when no token stored', () => {
      expect(getStoredToken()).toBeNull();
    });

    it('should return valid token from localStorage', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      localStorage.setItem('app.access_token', token);

      expect(getStoredToken()).toBe(token);
    });

    it('should return null and clear expired token from localStorage', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      localStorage.setItem('app.access_token', token);

      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should return null for malformed token stored', () => {
      localStorage.setItem('app.access_token', 'malformed');

      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should handle localStorage unavailable gracefully', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(getStoredToken()).toBeNull();

      spy.mockRestore();
    });
  });

  describe('setStoredToken', () => {
    it('should persist token to localStorage', () => {
      const token = 'test.token.123';

      setStoredToken(token);

      expect(localStorage.getItem('app.access_token')).toBe(token);
    });

    it('should handle localStorage unavailable gracefully', () => {
      const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => {
        setStoredToken('token');
      }).not.toThrow();

      spy.mockRestore();
    });
  });

  describe('clearStoredToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('app.access_token', 'token');

      clearStoredToken();

      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should handle localStorage unavailable gracefully', () => {
      const spy = vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => {
        clearStoredToken();
      }).not.toThrow();

      spy.mockRestore();
    });
  });
});
