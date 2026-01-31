import { Component } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h2>Welcome to Exam Platform</h2>
      
      <ng-container *ngIf="currentUser$ | async as user">
        <div class="user-card">
          <h3>User Profile</h3>
          <p><strong>Username:</strong> {{ user.username }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Role:</strong> <span class="role-badge" [ngClass]="'role-' + user.role_name">{{ user.role_name }}</span></p>
        </div>

        <div class="info-section" *ngIf="user.role_name === 'ADMIN'">
          <h3>Admin Panel</h3>
          <p>As an administrator, you have access to:</p>
          <ul>
            <li>Manage all users</li>
            <li>View system analytics</li>
            <li>Configure platform settings</li>
          </ul>
        </div>

        <div class="info-section" *ngIf="user.role_name === 'INSTRUCTOR'">
          <h3>Instructor Panel</h3>
          <p>As an instructor, you can:</p>
          <ul>
            <li>Create and manage exams</li>
            <li>View student submissions</li>
            <li>Grade assessments</li>
          </ul>
        </div>

        <div class="info-section" *ngIf="user.role_name === 'STUDENT'">
          <h3>Student Portal</h3>
          <p>As a student, you can:</p>
          <ul>
            <li>View available exams</li>
            <li>Take assessments</li>
            <li>View your grades</li>
          </ul>
        </div>
      </ng-container>

      <div class="info-box">
        <h3>LEVEL 1 Status</h3>
        <p>✓ Authentication & Authorization</p>
        <p>✓ Role-Based Access Control</p>
        <p>✓ JWT Token Management</p>
        <p>Coming in LEVEL 2+: Exam Management, Assessments, Grading</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .user-card {
      background: white;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .user-card h3 {
      margin-top: 0;
      color: #2c3e50;
    }

    .user-card p {
      margin: 0.5rem 0;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: bold;
      font-size: 0.85rem;
      color: white;
    }

    .role-ADMIN {
      background-color: #e74c3c;
    }

    .role-INSTRUCTOR {
      background-color: #3498db;
    }

    .role-STUDENT {
      background-color: #27ae60;
    }

    .info-section {
      background: #f8f9fa;
      border-left: 4px solid #3498db;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border-radius: 4px;
    }

    .info-section h3 {
      margin-top: 0;
      color: #2c3e50;
    }

    .info-section ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .info-section li {
      margin: 0.5rem 0;
    }

    .info-box {
      background: #ecf0f1;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .info-box h3 {
      margin-top: 0;
      color: #2c3e50;
    }

    .info-box p {
      margin: 0.5rem 0;
      font-size: 0.95rem;
    }
  `]
})
export class DashboardComponent {
  currentUser$ = this.authService.currentUser$;

  constructor(private authService: AuthService) {}
}
