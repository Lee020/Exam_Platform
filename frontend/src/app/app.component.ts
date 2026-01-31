import { Component } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h1>Exam Platform</h1>
        </div>
        <div class="navbar-menu">
          <ng-container *ngIf="(authService.isLoggedIn$ | async)">
            <span class="user-info">{{ (authService.currentUser$ | async)?.username }}</span>
            <button (click)="logout()" class="btn btn-logout">Logout</button>
          </ng-container>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .navbar {
      background-color: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-brand h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-info {
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .btn-logout {
      padding: 0.5rem 1rem;
      background-color: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-logout:hover {
      background-color: #c0392b;
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
  `]
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
