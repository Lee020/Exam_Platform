import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { interval, Subscription } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-exam-monitoring',
    template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0">Live Monitoring: {{ data?.exam_title }}</h2>
          <p class="text-muted" *ngIf="data">Currently watching {{ data.active_count }} active students</p>
        </div>
        <div class="d-flex align-items-center gap-2">
            <span class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
            <span class="text-danger fw-bold">LIVE</span>
            <button class="btn btn-outline-secondary btn-sm ms-3" (click)="loadData()">
                <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
        </div>
      </div>

      <div class="row">
        <div class="col-md-12">
          <div class="card shadow-sm">
            <div class="card-body p-0">
              <table class="table table-hover mb-0 align-middle">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4">Student</th>
                    <th>Start Time</th>
                    <th>Time Elapsed</th>
                    <th>Violations</th>
                    <th>Last Activity</th>
                    <th class="text-end pe-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let student of data?.students">
                    <td class="ps-4">
                      <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                          {{ student.username?.charAt(0)?.toUpperCase() || '?' }}
                        </div>
                        <span class="fw-medium">{{ student.username }}</span>
                      </div>
                    </td>
                    <td>{{ student.start_time | date:'shortTime' }}</td>
                    <td>{{ getTimeElapsed(student.start_time) }}</td>
                    <td>
                      <span class="badge" [class.bg-danger]="student.violation_count > 0" [class.bg-success]="student.violation_count === 0">
                        {{ student.violation_count }} violations
                      </span>
                    </td>
                    <td>{{ student.finish_time ? (student.finish_time | date:'shortTime') : 'Active now' }}</td>
                    <td class="text-end pe-4">
                      <span class="badge rounded-pill bg-success-subtle text-success border border-success">
                        IN PROGRESS
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!data?.students || data.students.length === 0">
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-person-dash display-4 d-block mb-3"></i>
                        No active attempts at the moment.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4">
          <a routerLink="/exams" class="btn btn-secondary">Back to Exams</a>
      </div>
    </div>
  `,
    styles: [`
    .bg-success-subtle { background-color: #f0fff4; }
  `]
})
export class ExamMonitoringComponent implements OnInit, OnDestroy {
    examId: string | null = null;
    data: any = null;
    private refreshSub: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private examService: ExamService
    ) { }

    ngOnInit(): void {
        this.examId = this.route.snapshot.paramMap.get('id');
        if (this.examId) {
            // Start auto-refresh every 10 seconds
            this.refreshSub = interval(10000).pipe(
                startWith(0),
                switchMap(() => this.examService.getExamMonitoring(this.examId!))
            ).subscribe({
                next: (res) => this.data = res,
                error: (err) => console.error('Monitoring load error', err)
            });
        }
    }

    ngOnDestroy(): void {
        if (this.refreshSub) {
            this.refreshSub.unsubscribe();
        }
    }

    loadData(): void {
        if (this.examId) {
            this.examService.getExamMonitoring(this.examId).subscribe(res => this.data = res);
        }
    }

    getTimeElapsed(startTime: string): string {
        const start = new Date(startTime).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);

        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins}m ${secs}s`;
    }
}
