import { Component, OnInit } from '@angular/core';
import { AttemptService, Attempt } from '../../services/attempt.service';

@Component({
  selector: 'app-attempt-history',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>My Attempt History</h2>
        <a routerLink="/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
      </div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="bg-light">
                <tr>
                  <th scope="col" class="ps-4">Exam</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Score</th>
                  <th scope="col" class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let attempt of attempts">
                  <td class="ps-4 fw-medium">{{ attempt.exam_title }}</td>
                  <td>{{ attempt.start_time | date:'medium' }}</td>
                  <td>
                    <span class="badge" 
                          [ngClass]="{
                            'bg-success': attempt.status === 'COMPLETED',
                            'bg-warning': attempt.status === 'STARTED',
                            'bg-danger': attempt.status === 'TIMEOUT'
                          }">
                      {{ attempt.status }}
                    </span>
                  </td>
                  <td>
                    <span *ngIf="attempt.status === 'COMPLETED'" class="fw-bold text-primary">{{ attempt.score }}</span>
                    <span *ngIf="attempt.status !== 'COMPLETED'" class="text-muted">-</span>
                  </td>
                  <td class="text-end pe-4">
                    <a *ngIf="attempt.status === 'COMPLETED'" 
                       [routerLink]="['/attempts', attempt.id, 'result']" 
                       class="btn btn-sm btn-outline-primary me-2">
                       Summary
                    </a>
                     <a *ngIf="attempt.status === 'COMPLETED'" 
                        [routerLink]="['/attempts', attempt.id, 'review']" 
                        class="btn btn-sm btn-outline-info me-2">
                        Detailed Review
                     </a>
                     <a *ngIf="attempt.status === 'COMPLETED' && attempt.score >= 40" 
                        [href]="attemptService.getCertificateDownloadUrl(attempt.id)" 
                        target="_blank"
                        class="btn btn-sm btn-success">
                        <i class="bi bi-patch-check"></i> Certificate
                     </a>
                    <a *ngIf="attempt.status === 'STARTED'"
                       [routerLink]="['/attempts/exam', attempt.exam, 'start']"
                       class="btn btn-sm btn-warning">
                       Resume
                    </a>
                  </td>
                </tr>
                <tr *ngIf="attempts.length === 0">
                  <td colspan="5" class="text-center py-5 text-muted">
                    <p class="mb-0">You haven't taken any exams yet.</p>
                    <a routerLink="/dashboard" class="btn btn-primary btn-sm mt-2">Browse Exams</a>
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
export class AttemptHistoryComponent implements OnInit {
  attempts: Attempt[] = [];

  constructor(public attemptService: AttemptService) { }

  ngOnInit(): void {
    this.attemptService.getMyAttempts().subscribe({
      next: (data: any) => this.attempts = data.results || data,
      error: (err) => console.error('Error loading attempts', err)
    });
  }
}
