import { Component } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div class="container">
          <a class="navbar-brand fw-bold" routerLink="/">Exam Platform</a>
          
          <button class="navbar-toggler" type="button" (click)="isMenuCollapsed = !isMenuCollapsed">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" [class.show]="!isMenuCollapsed">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0" *ngIf="authService.isLoggedIn$ | async">
              <li class="nav-item">
                <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
              </li>
              
              <!-- INSTRUCTOR LINKS -->
              <ng-container *ngIf="(authService.currentUser$ | async)?.role_name === 'INSTRUCTOR'">
                <li class="nav-item">
                   <a class="nav-link" routerLink="/exams" routerLinkActive="active">My Exams</a>
                </li>
                <li class="nav-item">
                   <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Performance Stats</a>
                </li>
                <li class="nav-item">
                   <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">Students</a>
                </li>
              </ng-container>

              <!-- STUDENT LINKS -->
              <ng-container *ngIf="(authService.currentUser$ | async)?.role_name === 'STUDENT'">
                <li class="nav-item">
                   <a class="nav-link" routerLink="/attempts">My Attempts</a>
                </li>
              </ng-container>

              <!-- ADMIN LINKS -->
              <ng-container *ngIf="(authService.currentUser$ | async)?.role_name === 'ADMIN'">
                <li class="nav-item">
                   <a class="nav-link" routerLink="/admin/users" routerLinkActive="active">Student Base</a>
                </li>
                <li class="nav-item">
                   <a class="nav-link" href="http://localhost:8000/admin" target="_blank">Django Admin</a>
                </li>
              </ng-container>
            </ul>

            <div class="d-flex align-items-center gap-3" *ngIf="authService.isLoggedIn$ | async">
               <span class="text-light small">
                  Signed in as <strong>{{ (authService.currentUser$ | async)?.username }}</strong>
                  <span class="badge bg-secondary ms-1">{{ (authService.currentUser$ | async)?.role_name }}</span>
               </span>
               <button (click)="logout()" class="btn btn-outline-light btn-sm">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main class="main-content py-4 bg-light">
         <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container { min-height: 100vh; display: flex; flex-direction: column; }
    .main-content { flex: 1; }
    .navbar-brand { font-size: 1.5rem; letter-spacing: 0.5px; }
    .nav-link.active { font-weight: bold; color: #fff !important; }
  `]
})
export class AppComponent {
  isMenuCollapsed = true;

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
