import { Injectable, inject, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config.js';
import { LoginRequest, LoginResponse } from './models/login.models.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  // Token stored in memory only (signal, not persisted)
  private readonly token = signal<string | null>(null);

  // Public readonly computed, derived from token signal
  readonly isAuthenticated = computed(() => this.token() !== null);

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((response) => {
        this.token.set(response.access_token);
      }),
    );
  }

  logout(): void {
    this.token.set(null);
  }

  getToken(): string | null {
    return this.token();
  }
}
