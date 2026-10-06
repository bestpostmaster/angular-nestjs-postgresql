import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginForm } from '../auth/login-form/login-form.js';

@Component({
  imports: [LoginForm],
  selector: 'app-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}
