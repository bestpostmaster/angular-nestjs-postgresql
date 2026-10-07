import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoginForm } from './login-form.js';
import { AuthService } from '../auth.js';
import { API_URL } from '../../config.js';
import { LoginResponse } from '../models/login.models.js';

describe('LoginForm', () => {
  let component: LoginForm;
  let fixture: ComponentFixture<LoginForm>;
  let authService: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3002';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginForm, HttpClientTestingModule],
      providers: [AuthService, { provide: API_URL, useValue: apiUrl }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginForm);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Form validation', () => {
    it('should validate email required', () => {
      const emailControl = component.form.get('email');
      expect(emailControl?.hasError('required')).toBe(true);
      emailControl?.setValue('test@example.com');
      expect(emailControl?.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should validate password required', () => {
      const passwordControl = component.form.get('password');
      expect(passwordControl?.hasError('required')).toBe(true);
      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
    });

    it('should not submit when email is invalid', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();

      component.onSubmit();

      httpMock.expectNone(`${apiUrl}/login`);
    });

    it('should not submit when password is empty', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('test@example.com');
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('');

      component.onSubmit();

      httpMock.expectNone(`${apiUrl}/login`);
    });
  });

  describe('Form submission - Success', () => {
    it('should send correct login request with email and password', () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });

      const response: LoginResponse = { access_token: 'token123' };
      req.flush(response);

      expect(authService.isAuthenticated()).toBe(true);
      expect(component.errorMessage()).toBeNull();
    });

    it('should reset form after successful login', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      const response: LoginResponse = { access_token: 'token123' };
      req.flush(response);

      await fixture.whenStable();
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
    });

    it('should set loading to false after successful login', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component.isLoading()).toBe(false);
      component.onSubmit();
      expect(component.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/login`);
      const response: LoginResponse = { access_token: 'token123' };
      req.flush(response);

      await fixture.whenStable();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Form submission - Errors', () => {
    it('should display error message on 401 Unauthorized', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      await fixture.whenStable();
      expect(component.errorMessage()).toBe('Identifiants invalides');
    });

    it('should display generic error message on network error', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.error(new ProgressEvent('error'), { status: 500 });

      await fixture.whenStable();
      expect(component.errorMessage()).toBe('Erreur réseau ou serveur. Veuillez réessayer.');
    });

    it('should set loading to false on error', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();
      expect(component.isLoading()).toBe(true);

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      await fixture.whenStable();
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Double submission prevention', () => {
    it('should prevent submission when already loading', () => {
      component.isLoading.set(true);
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      httpMock.expectNone(`${apiUrl}/login`);
    });
  });

  describe('Logout', () => {
    it('should clear token and reset form on logout', async () => {
      // First, login
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      const response: LoginResponse = { access_token: 'token123' };
      req.flush(response);

      await fixture.whenStable();
      expect(authService.isAuthenticated()).toBe(true);

      // Then logout
      component.onLogout();
      expect(authService.isAuthenticated()).toBe(false);
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Component lifecycle', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the label provided through the input', () => {
      fixture.componentRef.setInput('submitLabel', 'Ouvrir la session');
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('[data-testid="submit-button"]');
      expect(submitButton?.textContent).toContain('Ouvrir la session');
    });

    it('should initialize form with email and password controls', () => {
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
    });

    it('should initialize loading signal as false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should initialize error message as null', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('should initialize showPassword signal as false', () => {
      expect(component.showPassword()).toBe(false);
    });

    it('should display login form when not authenticated', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const form = compiled.querySelector('.login-form');
      const authenticated = compiled.querySelector('.authenticated-state');

      expect(form).toBeTruthy();
      expect(authenticated).toBeFalsy();
    });

    it('should display authenticated state when isAuthenticated is true', async () => {
      // Login first
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      const req = httpMock.expectOne(`${apiUrl}/login`);
      const response: LoginResponse = { access_token: 'token123' };
      req.flush(response);

      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const form = compiled.querySelector('.login-form');
      const authenticated = compiled.querySelector('.authenticated-state');

      expect(form).toBeFalsy();
      expect(authenticated).toBeTruthy();
    });
  });

  describe('Form validation errors rendering in DOM', () => {
    it('should display email validation error message when invalid and touched', async () => {
      const emailControl = component.form.get('email');

      // Set invalid email value and mark touched
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify error message appears in DOM with correct text
      const errorDiv = fixture.nativeElement.querySelector('#email-errors');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.textContent).toContain('adresse email valide');
    });

    it('should display password required error after submit attempt with empty form', async () => {
      const emailControl = component.form.get('email');

      // Set valid email but leave password empty
      emailControl?.setValue('test@example.com');

      // Try to submit - this should mark all fields as touched
      component.onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify password error appears in DOM
      const passwordErrorDiv = fixture.nativeElement.querySelector('#password-errors');
      expect(passwordErrorDiv).toBeTruthy();
      expect(passwordErrorDiv?.textContent).toContain('mot de passe');
    });
  });

  describe('Accessibility (a11y)', () => {
    it('should have label correctly associated with email input via for attribute', () => {
      const emailLabel = fixture.nativeElement.querySelector('label[for="email"]');
      const emailInput = fixture.nativeElement.querySelector('#email');
      expect(emailLabel).toBeTruthy();
      expect(emailInput).toBeTruthy();
      expect(emailLabel?.getAttribute('for')).toBe(emailInput?.id);
    });

    it('should have label correctly associated with password input via for attribute', () => {
      const passwordLabel = fixture.nativeElement.querySelector('label[for="password"]');
      const passwordInput = fixture.nativeElement.querySelector('#password');
      expect(passwordLabel).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(passwordLabel?.getAttribute('for')).toBe(passwordInput?.getAttribute('id'));
    });

    it('should update aria-invalid on password input when error state changes', async () => {
      const passwordControl = component.form.get('password');
      const passwordInput = fixture.nativeElement.querySelector('#password');

      // Initially should be true when touched with empty value
      passwordControl?.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(passwordInput?.getAttribute('aria-invalid')).toBe('true');

      // After entering valid value, should be false
      passwordControl?.setValue('validpassword');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(passwordInput?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should remove aria-live since role=alert already provides assertive announcement', () => {
      component.errorMessage.set('Test error');
      fixture.detectChanges();

      const errorAlert = fixture.nativeElement.querySelector('.error-alert[role="alert"]');
      expect(errorAlert).toBeTruthy();
      expect(errorAlert?.getAttribute('aria-live')).toBeNull();
    });
  });

  describe('Form validation with touched state (DOM integration)', () => {
    it('should display both email and password errors on submit with empty form', async () => {
      // Start with completely empty form
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');

      // Submit the form (should trigger markAllAsTouched)
      component.onSubmit();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify email error is visible in DOM
      const emailErrorDiv = fixture.nativeElement.querySelector('#email-errors');
      expect(emailErrorDiv).toBeTruthy();
      expect(emailErrorDiv?.textContent).toContain("L'email est requis");

      // Verify password error is visible in DOM
      const passwordErrorDiv = fixture.nativeElement.querySelector('#password-errors');
      expect(passwordErrorDiv).toBeTruthy();
      expect(passwordErrorDiv?.textContent).toContain('Le mot de passe est requis');

      // Verify aria-invalid is set on email input
      const emailInput = fixture.nativeElement.querySelector('#email');
      expect(emailInput?.getAttribute('aria-invalid')).toBe('true');

      // Verify aria-invalid is set on password input
      const passwordInput = fixture.nativeElement.querySelector('#password');
      expect(passwordInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should display error on blur with empty email field', async () => {
      const emailControl = component.form.get('email');
      const emailInput = fixture.nativeElement.querySelector('#email');

      // Leave email empty and blur it
      emailInput.dispatchEvent(new Event('blur'));
      emailControl?.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify error appears
      const emailErrorDiv = fixture.nativeElement.querySelector('#email-errors');
      expect(emailErrorDiv).toBeTruthy();
      expect(emailErrorDiv?.textContent).toContain("L'email est requis");
      expect(emailInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should clear error when valid value is entered after blur', async () => {
      const emailControl = component.form.get('email');
      const emailInput = fixture.nativeElement.querySelector('#email');

      // Trigger blur with empty value
      emailInput.dispatchEvent(new Event('blur'));
      emailControl?.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify error exists
      let emailErrorDiv = fixture.nativeElement.querySelector('#email-errors');
      expect(emailErrorDiv).toBeTruthy();

      // Now enter valid email
      emailControl?.setValue('valid@example.com');
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify error is gone
      emailErrorDiv = fixture.nativeElement.querySelector('#email-errors');
      expect(emailErrorDiv).toBeFalsy();
      expect(emailInput?.getAttribute('aria-invalid')).toBe('false');
    });

    it('should set aria-describedby on password input when invalid', async () => {
      const passwordControl = component.form.get('password');
      const passwordInput = fixture.nativeElement.querySelector('#password');

      // Mark touched and invalid
      passwordControl?.markAsTouched();
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify aria-describedby is set
      expect(passwordInput?.getAttribute('aria-describedby')).toBe('password-errors');

      // After entering valid value
      passwordControl?.setValue('validpassword');
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify aria-describedby is removed
      expect(passwordInput?.getAttribute('aria-describedby')).toBeNull();
    });
  });

  describe('Password visibility toggle', () => {
    it('should toggle password visibility on button click', () => {
      const toggleButton = fixture.nativeElement.querySelector(
        '[data-testid="toggle-password-button"]',
      );

      expect(component.showPassword()).toBe(false);
      toggleButton.click();
      expect(component.showPassword()).toBe(true);
      toggleButton.click();
      expect(component.showPassword()).toBe(false);
    });

    it('should change input type based on showPassword signal', async () => {
      const passwordInput = fixture.nativeElement.querySelector('#password');

      expect(passwordInput?.type).toBe('password');

      component.showPassword.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(passwordInput?.type).toBe('text');

      component.showPassword.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(passwordInput?.type).toBe('password');
    });

    it('should have accessible toggle button with aria-label', () => {
      const toggleButton = fixture.nativeElement.querySelector(
        '[data-testid="toggle-password-button"]',
      );

      // When password is hidden
      expect(toggleButton?.getAttribute('aria-label')).toBe('Afficher le mot de passe');
      expect(toggleButton?.getAttribute('aria-pressed')).toBe('false');

      // After toggling
      component.showPassword.set(true);
      fixture.detectChanges();

      expect(toggleButton?.getAttribute('aria-label')).toBe('Masquer le mot de passe');
      expect(toggleButton?.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
