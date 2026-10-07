import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginForm } from '../auth/login-form/login-form.js';

/**
 * Point fort de l'application (présentation de la valeur ajoutée)
 */
interface StrengthPoint {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

@Component({
  imports: [LoginForm],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  /**
   * Points forts de l'application : présentés visuellement avec icônes PrimeIcons
   */
  protected readonly strengthPoints: readonly StrengthPoint[] = [
    {
      icon: 'pi-shield',
      title: 'Sécurisé',
      description: 'Authentification JWT robuste et chiffrement des données sensibles',
    },
    {
      icon: 'pi-bolt',
      title: 'Performant',
      description: 'Architecture NestJS optimisée et base de données PostgreSQL scalable',
    },
    {
      icon: 'pi-palette',
      title: 'Moderne',
      description: 'Interface Angular 22 responsive avec PrimeNG et design épuré',
    },
  ];
}
