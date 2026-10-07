import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Home } from './home.js';
import { API_URL } from '../config.js';
import { AuthService } from '../auth/auth.js';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, HttpClientTestingModule],
      providers: [AuthService, { provide: API_URL, useValue: 'http://localhost:3002' }],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display main element with home-main class', () => {
    const compiled = fixture.nativeElement;
    const main = compiled.querySelector('main.home-main');
    expect(main).toBeTruthy();
  });

  it('should display connection title in h1', () => {
    const compiled = fixture.nativeElement;
    const heading = compiled.querySelector('h1.login-title');
    expect(heading?.textContent).toContain('Connexion');
  });

  it('should display login form component', () => {
    const compiled = fixture.nativeElement;
    const loginForm = compiled.querySelector('app-login-form');
    expect(loginForm).toBeTruthy();
  });

  it('should display brand panel with app name', () => {
    const compiled = fixture.nativeElement;
    const brandPanel = compiled.querySelector('.home-brand-panel');
    const appName = compiled.querySelector('.app-name');
    expect(brandPanel).toBeTruthy();
    expect(appName?.textContent).toContain('Angular Training');
  });

  it('should display three strength points', () => {
    const compiled = fixture.nativeElement;
    const strengthPoints = compiled.querySelectorAll('[data-testid="strength-point"]');
    expect(strengthPoints.length).toBe(3);
  });

  it('should display strength points list', () => {
    const compiled = fixture.nativeElement;
    const list = compiled.querySelector('[data-testid="strength-points-list"]');
    expect(list).toBeTruthy();
  });

  it('should render all strength points with title and description', () => {
    const compiled = fixture.nativeElement;
    const pointItems = compiled.querySelectorAll('.strength-point-item');
    expect(pointItems.length).toBe(3);

    pointItems.forEach((item: HTMLElement) => {
      const title = item.querySelector('.strength-title');
      const description = item.querySelector('.strength-description');
      expect(title?.textContent).toBeTruthy();
      expect(description?.textContent).toBeTruthy();
    });
  });

  it('should render strength point icons with aria-hidden', () => {
    const compiled = fixture.nativeElement;
    const icons = compiled.querySelectorAll('.strength-icon i');
    icons.forEach((icon: HTMLElement) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('should display login card section', () => {
    const compiled = fixture.nativeElement;
    const loginCard = compiled.querySelector('.home-login-card');
    expect(loginCard).toBeTruthy();
  });
});
