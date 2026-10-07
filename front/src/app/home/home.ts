import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginForm } from '../auth/login-form/login-form.js';
import { Icon, type IconName } from '../shared/icon/icon.js';

/**
 * Point fort de l'application (présentation de la valeur ajoutée)
 */
interface StrengthPoint {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

@Component({
  imports: [LoginForm, Icon],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  /**
   * Points forts de l'application : présentés visuellement avec icônes SVG
   */
  protected readonly strengthPoints: readonly StrengthPoint[] = [
    {
      icon: 'shield',
      title: 'Sécurisé',
      description: 'Authentification JWT robuste et chiffrement des données sensibles',
    },
    {
      icon: 'bolt',
      title: 'Performant',
      description: 'Architecture NestJS optimisée et base de données PostgreSQL scalable',
    },
    {
      icon: 'palette',
      title: 'Moderne',
      description: 'Interface Angular 22 responsive avec PrimeNG et design épuré',
    },
  ];
}
