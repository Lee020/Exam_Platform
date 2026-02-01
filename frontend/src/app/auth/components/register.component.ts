import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Register</h2>
        
        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              class="form-control"
              placeholder="Choose a username"
              [class.is-invalid]="isFieldInvalid('username')"
            />
              <small *ngIf="isFieldInvalid('username')" class="error-text">
                Username is required (alphanumeric and _ only)
              </small>
              <div *ngIf="fieldErrors?.username" class="error-text">
                <div *ngFor="let msg of fieldErrors.username">{{ msg }}</div>
              </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              placeholder="Enter your email"
              [class.is-invalid]="isFieldInvalid('email')"
            />
            <small *ngIf="isFieldInvalid('email')" class="error-text">
              Valid email is required
            </small>
            <div *ngIf="fieldErrors?.email" class="error-text">
              <div *ngFor="let msg of fieldErrors.email">{{ msg }}</div>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-input-group">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                formControlName="password"
                class="form-control"
                placeholder="Minimum 8 characters"
                [class.is-invalid]="isFieldInvalid('password')"
              />
              <button type="button" class="btn-toggle-password" (click)="togglePassword()">
                <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
              </button>
            </div>
            <small *ngIf="isFieldInvalid('password')" class="error-text">
              Password must be at least 8 characters
            </small>
            <div *ngIf="fieldErrors?.password" class="error-text">
              <div *ngFor="let msg of fieldErrors.password">{{ msg }}</div>
            </div>
          </div>

          <div class="form-group">
            <label for="password_confirm">Confirm Password</label>
            <div class="password-input-group">
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                id="password_confirm"
                formControlName="password_confirm"
                class="form-control"
                placeholder="Confirm your password"
                [class.is-invalid]="isFieldInvalid('password_confirm')"
              />
              <button type="button" class="btn-toggle-password" (click)="toggleConfirmPassword()">
                <i class="bi" [class.bi-eye]="!showConfirmPassword" [class.bi-eye-slash]="showConfirmPassword"></i>
              </button>
            </div>
            <small *ngIf="isFieldInvalid('password_confirm')" class="error-text">
              Passwords must match
            </small>
            <div *ngIf="fieldErrors?.password_confirm" class="error-text">
              <div *ngFor="let msg of fieldErrors.password_confirm">{{ msg }}</div>
            </div>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select
              id="role"
              formControlName="role"
              class="form-select"
            >
              <option value="STUDENT">Student</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="ADMIN">Administrator</option>
            </select>
            <small class="hint-text">Select your role on the platform</small>
            <div *ngIf="fieldErrors?.role" class="error-text">
              <div *ngFor="let msg of fieldErrors.role">{{ msg }}</div>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!registerForm.valid || isLoading"
          >
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>
        </form>

        <p class="auth-link">
          Already have an account? <a routerLink="/login">Login here</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .auth-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      padding: 2rem;
      width: 100%;
      max-width: 450px;
      position: relative; /* Fix for dropdown positioning context */
      transform: none; /* Prevent stacking context issues */
    }

    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-control.is-invalid,
    .form-select.is-invalid {
      border-color: #e74c3c;
    }

    .error-text {
      color: #e74c3c;
      font-size: 0.85rem;
      display: block;
      margin-top: 0.25rem;
    }

    .hint-text {
      color: #95a5a6;
      font-size: 0.85rem;
      display: block;
      margin-top: 0.25rem;
    }

    .alert {
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .alert-error {
      background-color: #fadbd8;
      color: #c0392b;
      border: 1px solid #e74c3c;
    }

    .alert-success {
      background-color: #d5f4e6;
      color: #27ae60;
      border: 1px solid #27ae60;
    }

    .btn {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #5568d3;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .auth-link {
      text-align: center;
      margin-top: 1.5rem;
      color: #7f8c8d;
    }

    .auth-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-link a:hover {
      text-decoration: underline;
    }

    .password-input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .btn-toggle-password {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #7f8c8d;
      cursor: pointer;
      padding: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }

    .btn-toggle-password:hover {
      color: #2c3e50;
    }

    .form-control {
      padding-right: 40px !important;
    }

    /* Fix for Linux browser dropdown positioning bug */
    select.form-select {
      appearance: auto !important;
      background-image: none !important;
      padding-right: 1rem !important;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  fieldErrors: any = {};
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required, Validators.minLength(8)]],
      role: ['STUDENT', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('password_confirm')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, email, password, password_confirm, role } = this.registerForm.value;

    this.authService.register(username, email, password, password_confirm, role).subscribe({
      next: () => {
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: any) => {
        this.isLoading = false;
        // Expect structured error object: { message, errors }
        this.fieldErrors = error?.errors || {};
        this.errorMessage = error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
