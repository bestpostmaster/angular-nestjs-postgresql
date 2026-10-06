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

  it('should display login form component', () => {
    const compiled = fixture.nativeElement;
    const loginForm = compiled.querySelector('app-login-form');
    expect(loginForm).toBeTruthy();
  });

  it('should display connection title', () => {
    const compiled = fixture.nativeElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('Connexion');
  });
});
