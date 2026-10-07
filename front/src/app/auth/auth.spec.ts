import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { AuthService } from './auth.js';
import { API_URL } from '../config.js';

/**
 * Génère un token JWT valide avec un champ exp
 */
function createValidJWT(expiryOffsetSeconds = 3600): string {
  const futureTime = Math.floor(Date.now() / 1000) + expiryOffsetSeconds;
  const payload = btoa(JSON.stringify({ exp: futureTime })).replace(/=/g, '');
  return `header.${payload}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3002';

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Token initialization', () => {
    it('should initialize with no token when storage is empty', () => {
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should restore valid token from localStorage on startup', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      localStorage.setItem('app.access_token', token);

      // Create new service instance to test initialization
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBe(token);
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should ignore expired token from localStorage on startup', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      localStorage.setItem('app.access_token', token);

      // Create new service instance to test initialization
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should ignore malformed token from localStorage on startup', () => {
      localStorage.setItem('app.access_token', 'malformed');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });
  });

  describe('Token management', () => {
    it('should store token after successful login', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(service.getToken()).toBe(validToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should persist token to localStorage after login', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(localStorage.getItem('app.access_token')).toBe(validToken);
    });

    it('should update isAuthenticated to true when token is set', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear token on logout', () => {
      const validToken = createValidJWT();
      // First login
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(service.getToken()).toBe(validToken);

      // Then logout
      service.logout();
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should remove token from localStorage on logout', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(localStorage.getItem('app.access_token')).toBe(validToken);

      service.logout();
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should allow logout before login', () => {
      expect(() => {
        service.logout();
      }).not.toThrow();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('login request', () => {
    it('should send POST request to /login endpoint', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });

      req.flush({ access_token: validToken });
    });

    it('should return LoginResponse with access_token', () => {
      const validToken = createValidJWT();
      let response: { access_token: string } | undefined;

      service.login('test@example.com', 'password123').subscribe((r) => {
        response = r;
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(response?.access_token).toBe(validToken);
    });

    it('should propagate error on failed login', () => {
      let errorStatus: number | undefined;

      service.login('test@example.com', 'wrongpassword').subscribe(
        () => {
          throw new Error('should have failed');
        },
        (error) => {
          errorStatus = error.status;
        },
      );

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorStatus).toBe(401);
    });

    it('should not store token on failed login', () => {
      service.login('test@example.com', 'wrongpassword').subscribe(
        () => {
          throw new Error('should have failed');
        },
        () => {
          // Error handler
        },
      );

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });
  });

  describe('Token expiry', () => {
    it('should return null for expired token in getToken', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastTime })).replace(/=/g, '');
      const token = `header.${payload}.signature`;

      // Manually set an expired token
      localStorage.setItem('app.access_token', token);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBeNull();
      expect(localStorage.getItem('app.access_token')).toBeNull();
    });

    it('should logout when getToken detects expired token', () => {
      vi.useFakeTimers();
      try {
        // Create a token expiring in 5 seconds
        const validToken = createValidJWT(5);
        service.login('test@example.com', 'password123').subscribe();

        const req = httpMock.expectOne(`${apiUrl}/login`);
        req.flush({ access_token: validToken });

        expect(service.isAuthenticated()).toBe(true);
        expect(service.getToken()).toBe(validToken);

        // Advance time by 10 seconds, past the token expiry (5 seconds)
        vi.setSystemTime(new Date(Date.now() + 10000));

        // getToken should detect expiry and logout
        const result = service.getToken();

        expect(result).toBeNull();
        expect(service.isAuthenticated()).toBe(false);
        expect(localStorage.getItem('app.access_token')).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('Storage synchronization (cross-tab)', () => {
    it('should update token when storage event sets a new valid token', () => {
      const newToken = createValidJWT();

      const document = TestBed.inject(DOCUMENT);
      const storageEvent = new StorageEvent('storage', {
        key: 'app.access_token',
        newValue: newToken,
        oldValue: null,
      });

      document.defaultView?.dispatchEvent(storageEvent);

      expect(service.getToken()).toBe(newToken);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should clear token when storage event removes token', () => {
      const validToken = createValidJWT();
      // First login
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      expect(service.isAuthenticated()).toBe(true);

      // Simulate logout in another tab
      const document = TestBed.inject(DOCUMENT);
      const storageEvent = new StorageEvent('storage', {
        key: 'app.access_token',
        newValue: null,
        oldValue: validToken,
      });

      document.defaultView?.dispatchEvent(storageEvent);

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should ignore storage events for other keys', () => {
      const validToken = createValidJWT();
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: validToken });

      const document = TestBed.inject(DOCUMENT);
      const storageEvent = new StorageEvent('storage', {
        key: 'other.key',
        newValue: 'value',
        oldValue: null,
      });

      document.defaultView?.dispatchEvent(storageEvent);

      expect(service.getToken()).toBe(validToken);
    });

    it('should ignore expired token from storage event', () => {
      const expiredToken = createValidJWT(-3600); // Expired 1 hour ago

      const document = TestBed.inject(DOCUMENT);
      const storageEvent = new StorageEvent('storage', {
        key: 'app.access_token',
        newValue: expiredToken,
        oldValue: null,
      });

      document.defaultView?.dispatchEvent(storageEvent);

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
