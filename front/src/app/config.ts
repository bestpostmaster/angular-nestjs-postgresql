import { InjectionToken } from '@angular/core';
import { environment } from '../environments/environment.js';

export const API_URL = new InjectionToken<string>('api.url');

export function provideApiUrl(): { provide: InjectionToken<string>; useValue: string } {
  return { provide: API_URL, useValue: environment.apiUrl };
}
