import { Component, OnInit } from '@angular/core';
import { ExamService, Exam } from '../../services/exam.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-exam-list',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Exams</h2>
        <a routerLink="/exams/new" class="btn btn-primary" *ngIf="isAdmin || isInstructor">Create Exam</a>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Pass Marks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let exam of exams">
                  <td>{{ exam.title }}</td>
                  <td>
                    <span class="badge" [class.bg-success]="exam.status === 'PUBLISHED'" [class.bg-warning]="exam.status === 'DRAFT'">
                      {{ exam.status }}
                    </span>
                  </td>
                  <td>{{ exam.duration_minutes }} mins</td>
                  <td>{{ exam.pass_marks }}</td>
                  <td>
                    <div class="d-flex gap-2">
                        <a [routerLink]="['/exams', exam.id, 'edit']" class="btn btn-sm btn-outline-info" *ngIf="isAdmin || isInstructor">
                          <i class="bi bi-pencil"></i> Edit
                        </a>
                        <a [routerLink]="['/exams', exam.id, 'builder']" class="btn btn-sm btn-outline-primary" *ngIf="isAdmin || isInstructor">
                          <i class="bi bi-gear"></i> Builder
                        </a>
                        <a [routerLink]="['/exams', exam.id, 'analytics']" class="btn btn-sm btn-outline-secondary" *ngIf="isAdmin || isInstructor">
                          <i class="bi bi-graph-up"></i> Stats
                        </a>
                        <a [routerLink]="['/exams', exam.id, 'monitoring']" class="btn btn-sm btn-outline-danger" *ngIf="isInstructor">
                          <i class="bi bi-broadcast"></i> Monitor
                        </a>
                        <a [routerLink]="['/attempts/exam', exam.id, 'start']" class="btn btn-sm btn-success" *ngIf="exam.status === 'PUBLISHED'">
                          <i class="bi bi-play-fill"></i> Take Exam
                        </a>
                        <span class="badge bg-info text-dark" *ngIf="exam.status === 'DRAFT' && !isAdmin && !isInstructor">
                          <i class="bi bi-rocket-takeoff"></i> Coming Soon
                        </span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="exams.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">No exams found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExamListComponent implements OnInit {
  exams: Exam[] = [];
  isAdmin = false;
  isInstructor = false;

  constructor(
    private examService: ExamService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role_name === 'ADMIN';
    this.isInstructor = user?.role_name === 'INSTRUCTOR';
    this.loadExams();
  }

  loadExams(): void {
    this.examService.getExams().subscribe({
      next: (res: any) => {
        // API might return results inside a 'results' key if paginated, or direct array
        this.exams = res.results || res;
      },
      error: (err: any) => console.error('Error loading exams', err)
    });
  }
}
