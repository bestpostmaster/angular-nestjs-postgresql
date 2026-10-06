import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.js';
import { API_URL } from '../config.js';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3002';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token management', () => {
    it('should initialize with no token', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should initialize isAuthenticated as false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should store token after successful login', () => {
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      const response = { access_token: 'token123' };
      req.flush(response);

      expect(service.getToken()).toBe('token123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should update isAuthenticated to true when token is set', async () => {
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: 'token123' });

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear token on logout', () => {
      // First login
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: 'token123' });

      expect(service.getToken()).toBe('token123');

      // Then logout
      service.logout();
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
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
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });

      req.flush({ access_token: 'token123' });
    });

    it('should return LoginResponse with access_token', async () => {
      let response: { access_token: string } | undefined;

      service.login('test@example.com', 'password123').subscribe((r) => {
        response = r;
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: 'token123' });

      expect(response?.access_token).toBe('token123');
    });

    it('should propagate error on failed login', async () => {
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

    it('should not store token on failed login', async () => {
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
    });
  });

  describe('Token persistence', () => {
    it('should keep token in memory only (not persisted on page refresh)', () => {
      // Login
      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush({ access_token: 'token123' });

      expect(service.getToken()).toBe('token123');

      // Reset TestBed to simulate page refresh
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
      });

      // Create a new instance (simulating page refresh)
      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBeNull();
      expect(newService.isAuthenticated()).toBe(false);
    });
  });
});
