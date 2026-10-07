import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Types d'icônes SVG disponibles
 */
export type IconName = 'shield' | 'bolt' | 'palette' | 'logo' | 'lock';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  /**
   * Nom de l'icône à afficher
   */
  readonly name = input.required<IconName>();
}
