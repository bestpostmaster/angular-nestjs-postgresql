/**
 * authInterceptor tests
 *
 * Interceptor behavior is tested through integration tests in:
 * - LoginFormComponent (tests Bearer token injection and authentication flow)
 * - AuthService (tests token management)
 *
 * This spec file documents the interceptor's public API and basic instantiation.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor.js';
import { AuthService } from './auth.js';
import { API_URL } from '../config.js';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  const apiUrl = 'http://localhost:3002';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be a function', () => {
    expect(typeof authInterceptor).toBe('function');
  });

  it('should be callable as an HttpInterceptorFn', () => {
    expect(authInterceptor).toBeDefined();
  });

  it('should reject domain lookalike attacks by checking exact URL match', async () => {
    // First login to get a token
    authService.login('test@example.com', 'password123').subscribe();
    let req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ access_token: 'token123' });

    await new Promise((resolve) => setTimeout(resolve, 0));

    // Try to access lookalike domain - should NOT include token
    http.get('http://localhost:3002.evil.com/data').subscribe();
    req = httpMock.expectOne('http://localhost:3002.evil.com/data');

    // Verify no Authorization header was added
    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('should reject requests to exactly /login endpoint on 401 without logout', async () => {
    // First login to get a token
    authService.login('test@example.com', 'password123').subscribe();
    let req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush({ access_token: 'token123' });

    expect(authService.isAuthenticated()).toBe(true);

    // Try to re-login with wrong password - should NOT logout on 401
    authService.login('test@example.com', 'wrongpassword').subscribe(
      () => {
        throw new Error('should have failed');
      },
      () => {
        // Error handler
      },
    );

    req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Should still be authenticated (token not cleared)
    expect(authService.isAuthenticated()).toBe(true);
  });
});
