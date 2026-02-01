import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-exam-analytics',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
           <nav aria-label="breadcrumb">
             <ol class="breadcrumb mb-1">
               <li class="breadcrumb-item"><a routerLink="/exams">Exams</a></li>
               <li class="breadcrumb-item active">Analytics</li>
             </ol>
           </nav>
           <h2>Exam Analytics</h2>
        </div>
        <div class="d-flex gap-2">
          <button (click)="exportToCSV()" class="btn btn-success shadow-sm" [disabled]="analytics.length === 0">
             <i class="bi bi-file-earmark-spreadsheet"></i> Export Results
          </button>
          <a routerLink="/exams" class="btn btn-outline-secondary shadow-sm">
             <i class="bi bi-arrow-left"></i> Back to Exams
          </a>
        </div>
      </div>

      <div class="card shadow-sm border-0">
        <div class="card-header bg-white py-3">
          <h5 class="mb-0">Student Performance</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0 align-middle">
              <thead class="bg-light">
                <tr>
                  <th scope="col" class="ps-4">Student Name</th>
                  <th scope="col">Status</th>
                  <th scope="col">Started At</th>
                  <th scope="col">Score</th>
                  <th scope="col" class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let attempt of analytics">
                  <td class="ps-4">
                    <div class="d-flex align-items-center">
                      <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                        {{ attempt.username?.charAt(0)?.toUpperCase() || '?' }}
                      </div>
                      <span class="fw-medium">{{ attempt.username || 'Unknown' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" 
                          [ngClass]="{
                            'bg-success-subtle text-success': attempt.status === 'COMPLETED',
                            'bg-warning-subtle text-warning': attempt.status === 'STARTED',
                            'bg-danger-subtle text-danger': attempt.status === 'TIMEOUT'
                          }">
                      {{ attempt.status }}
                    </span>
                  </td>
                  <td>{{ attempt.start_time | date:'medium' }}</td>
                  <td>
                    <span *ngIf="attempt.status === 'COMPLETED'" class="fs-5 fw-bold text-primary">{{ attempt.score }}</span>
                    <span *ngIf="attempt.status !== 'COMPLETED'" class="text-muted italic small">In Progress</span>
                  </td>
                  <td class="text-end pe-4">
                    <a *ngIf="attempt.status === 'COMPLETED'" 
                       [routerLink]="['/attempts', attempt.id, 'review']" 
                       class="btn btn-sm btn-outline-primary shadow-sm">
                       Review Details
                    </a>
                    <span *ngIf="attempt.status !== 'COMPLETED'" class="text-muted small">N/A</span>
                  </td>
                </tr>
                <tr *ngIf="analytics.length === 0">
                  <td colspan="5" class="text-center py-5 text-muted">
                    <i class="bi bi-info-circle fs-2 d-block mb-2"></i>
                    No attempts recorded for this exam yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .breadcrumb-item + .breadcrumb-item::before { content: ">"; }
    .bg-success-subtle { background-color: #d1e7dd; }
    .bg-warning-subtle { background-color: #fff3cd; }
    .bg-danger-subtle { background-color: #f8d7da; }
  `]
})
export class ExamAnalyticsComponent implements OnInit {
  analytics: any[] = [];
  examId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private examService: ExamService
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id');
    if (this.examId) {
      this.loadAnalytics();
    }
  }

  loadAnalytics(): void {
    if (this.examId) {
      this.examService.getExamAnalytics(this.examId).subscribe({
        next: (data) => this.analytics = data,
        error: (err) => console.error('Error loading analytics', err)
      });
    }
  }

  exportToCSV(): void {
    if (this.analytics.length === 0) return;

    const headers = ['Student Name', 'Status', 'Started At', 'Score'];
    const rows = this.analytics.map(a => [
      a.username || 'Unknown',
      a.status,
      a.start_time,
      a.status === 'COMPLETED' ? a.score : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `exam_results_${this.examId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
