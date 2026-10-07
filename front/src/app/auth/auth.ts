import { Injectable, inject, computed, signal, DOCUMENT, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config.js';
import { LoginRequest, LoginResponse } from './models/login.models.js';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getTokenStorageKey,
  isTokenExpired,
} from './token-storage.js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // Token stored in memory (signal) and persisted to localStorage (voir token-storage.ts pour justification)
  private readonly token = signal<string | null>(null);

  // Public readonly computed, derived from token signal
  readonly isAuthenticated = computed(() => this.token() !== null);

  constructor() {
    this.initializeTokenFromStorage();
    this.setupStorageListener();
  }

  /**
   * Initialise le token depuis localStorage au démarrage.
   * Si le token est absent, illisible, mal formé ou expiré, le supprimer et rester déconnecté.
   */
  private initializeTokenFromStorage(): void {
    const storedToken = getStoredToken();
    if (storedToken) {
      this.token.set(storedToken);
    }
  }

  /**
   * Écoute les changements du storage depuis d'autres onglets.
   * Synchronise le signal token quand la clé change/est supprimée.
   */
  private setupStorageListener(): void {
    const window = this.document.defaultView;
    if (!window) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === getTokenStorageKey()) {
        if (event.newValue === null) {
          // Token supprimé dans un autre onglet
          this.token.set(null);
        } else {
          // Token mis à jour dans un autre onglet
          if (!isTokenExpired(event.newValue)) {
            this.token.set(event.newValue);
          } else {
            this.token.set(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Nettoyer le listener à la destruction du service
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('storage', handleStorageChange);
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((response) => {
        this.token.set(response.access_token);
        setStoredToken(response.access_token);
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    clearStoredToken();
  }

  /**
   * Retourne le token si valide, null sinon.
   * Si le token est expiré, le supprime et retourne null.
   */
  getToken(): string | null {
    const currentToken = this.token();
    if (!currentToken) return null;

    if (isTokenExpired(currentToken)) {
      this.logout();
      return null;
    }

    return currentToken;
  }
}
