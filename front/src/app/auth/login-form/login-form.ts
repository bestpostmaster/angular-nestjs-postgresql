import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.js';

/**
 * Validateur requis
 */
const requiredValidator = (control: AbstractControl): ValidationErrors | null => {
  return Validators.required(control);
};

/**
 * Validateur email
 */
const emailValidator = (control: AbstractControl): ValidationErrors | null => {
  return Validators.email(control);
};

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
})
export class LoginForm {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Signaux d'état
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  // Formulaire initialisé à la déclaration
  readonly form = this.fb.nonNullable.group({
    email: ['', [requiredValidator, emailValidator]],
    password: ['', requiredValidator],
  });

  // Signal qui suit tous les changements du formulaire (y compris touched)
  // form.events (Angular 18+) émet TouchedChangeEvent, StatusChangeEvent, ValueChangeEvent
  private readonly formState = toSignal(this.form.events, {
    initialValue: undefined,
  });

  // Computed qui dépend de formState pour réévaluation au changement d'état du formulaire
  readonly isEmailTouched = computed(() => {
    this.formState();
    return this.form.get('email')?.touched ?? false;
  });

  readonly isPasswordTouched = computed(() => {
    this.formState();
    return this.form.get('password')?.touched ?? false;
  });

  readonly isEmailInvalid = computed(() => {
    this.formState();
    return (this.form.get('email')?.invalid ?? false) && this.isEmailTouched();
  });

  readonly isPasswordInvalid = computed(() => {
    this.formState();
    return (this.form.get('password')?.invalid ?? false) && this.isPasswordTouched();
  });

  readonly emailErrors = computed<string[]>(() => {
    const control = this.form.get('email');
    if (!control?.errors || !this.isEmailTouched()) {
      return [];
    }
    const errors: string[] = [];
    if (control.hasError('required')) {
      errors.push("L'email est requis");
    }
    if (control.hasError('email')) {
      errors.push('Veuillez entrer une adresse email valide');
    }
    return errors;
  });

  readonly passwordErrors = computed<string[]>(() => {
    const control = this.form.get('password');
    if (!control?.errors || !this.isPasswordTouched()) {
      return [];
    }
    const errors: string[] = [];
    if (control.hasError('required')) {
      errors.push('Le mot de passe est requis');
    }
    return errors;
  });

  onSubmit(): void {
    // Éviter les doubles soumissions
    if (this.isLoading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.reset();
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          if (error instanceof HttpErrorResponse && error.status === 401) {
            // Message générique pour la sécurité (pas d'énumération d'utilisateurs)
            this.errorMessage.set('Identifiants invalides');
          } else {
            this.errorMessage.set('Erreur réseau ou serveur. Veuillez réessayer.');
          }
        },
      });
  }

  onLogout(): void {
    this.auth.logout();
    this.form.reset();
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
