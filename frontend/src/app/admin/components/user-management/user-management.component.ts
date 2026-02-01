import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-user-management',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="bg-light">
                <tr>
                  <th scope="col" class="ps-4">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col" class="text-end pe-4" *ngIf="isAdmin$ | async">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td class="ps-4">
                    <div class="fw-medium">{{ user.username }}</div>
                    <div class="small text-muted">{{ user.email }}</div>
                  </td>
                  <td>
                    <div *ngIf="!(isAdmin$ | async)">{{ user.role_name }}</div>
                    <select class="form-select form-select-sm w-auto" 
                            *ngIf="isAdmin$ | async"
                            [value]="user.role_name" 
                            (change)="changeRole(user, $event)">
                      <option value="ADMIN">ADMIN</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="STUDENT">STUDENT</option>
                    </select>
                  </td>
                  <td>
                    <div *ngIf="!(isAdmin$ | async)">{{ user.is_active ? 'Active' : 'Disabled' }}</div>
                    <div class="form-check form-switch" *ngIf="isAdmin$ | async">
                      <input class="form-check-input" type="checkbox" 
                             [checked]="user.is_active" 
                             (change)="toggleActive(user)">
                      <label class="form-check-label">{{ user.is_active ? 'Active' : 'Disabled' }}</label>
                    </div>
                  </td>
                  <td>{{ user.created_at | date:'shortDate' }}</td>
                  <td class="text-end pe-4" *ngIf="isAdmin$ | async">
                    <button class="btn btn-sm btn-outline-danger" (click)="deleteUser(user)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isAdmin$: Observable<boolean>;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.isAdmin$ = this.authService.currentUser$.pipe(
      map((user: any) => user?.role_name === 'ADMIN')
    );
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe((res: any) => {
      this.users = res.results || res;
    });
  }

  changeRole(user: User, event: any): void {
    const newRole = event.target.value;
    this.userService.updateUser(user.id, { role_id: newRole }).subscribe(() => {
      user.role_name = newRole;
    });
  }

  toggleActive(user: User): void {
    this.userService.updateUser(user.id, { is_active: !user.is_active }).subscribe(() => {
      user.is_active = !user.is_active;
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== user.id);
      });
    }
  }
}
