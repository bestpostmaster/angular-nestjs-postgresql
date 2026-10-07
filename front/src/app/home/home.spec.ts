import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Home } from './home.js';
import { Icon } from '../shared/icon/icon.js';
import { API_URL } from '../config.js';
import { AuthService } from '../auth/auth.js';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home, Icon, HttpClientTestingModule],
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

  it('should render strength point icons as SVG with app-icon component', () => {
    const compiled = fixture.nativeElement;
    const icons = compiled.querySelectorAll('.strength-icon app-icon');
    expect(icons.length).toBe(3);
    icons.forEach((icon: HTMLElement) => {
      const svg = icon.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(svg?.getAttribute('focusable')).toBe('false');
    });
  });

  it('should display login card section', () => {
    const compiled = fixture.nativeElement;
    const loginCard = compiled.querySelector('.home-login-card');
    expect(loginCard).toBeTruthy();
  });

  it('should display logo icon in app-name-wrapper', () => {
    const compiled = fixture.nativeElement;
    const appNameWrapper = compiled.querySelector('.app-name-wrapper');
    expect(appNameWrapper).toBeTruthy();

    const logoIcon = appNameWrapper?.querySelector('app-icon[name="logo"]');
    expect(logoIcon).toBeTruthy();

    const svg = logoIcon?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('should display lock icon in login-title-wrapper', () => {
    const compiled = fixture.nativeElement;
    const loginTitleWrapper = compiled.querySelector('.login-title-wrapper');
    expect(loginTitleWrapper).toBeTruthy();

    const lockIcon = loginTitleWrapper?.querySelector('app-icon[name="lock"]');
    expect(lockIcon).toBeTruthy();

    const svg = lockIcon?.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('should have h1 with "Connexion" text as only heading content', () => {
    const compiled = fixture.nativeElement;
    const h1 = compiled.querySelector('h1.login-title');
    expect(h1?.textContent).toContain('Connexion');
  });

  it('should have all SVG icons in page with aria-hidden="true"', () => {
    const compiled = fixture.nativeElement;
    const allSvgs = compiled.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
    allSvgs.forEach((svg: SVGElement) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    });
  });
});
