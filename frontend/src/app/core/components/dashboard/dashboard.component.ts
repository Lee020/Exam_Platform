import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { ExamService } from '../../../exams/services/exam.service';
import { AdminService } from '../../../admin/services/admin.service';
import { AttemptService } from '../../../attempts/services/attempt.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
   selector: 'app-dashboard',
   template: `
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="welcome-banner p-4 rounded shadow-sm bg-gradient text-white" 
               style="background: linear-gradient(135deg, #2c3e50, #3498db);">
            <h2 class="display-5">Welcome back, {{ (authService.currentUser$ | async)?.username | titlecase }}!</h2>
            <p class="lead mb-0">{{ (authService.currentUser$ | async)?.role_name }} Dashboard</p>
          </div>
        </div>
      </div>

      <!-- DASHBOARD OVERVIEW (Admin & Instructor) -->
      <div *ngIf="(isAdmin$ | async) || (isInstructor$ | async)" class="row">
         <div class="col-md-3 mb-4">
            <div class="card h-100 shadow-sm border-0 border-top border-4 border-primary hover-card">
               <div class="card-body text-center">
                  <h6 class="text-muted text-uppercase small">{{ (isAdmin$ | async) ? "Total Users" : "Active Students" }}</h6>
                  <h2 class="display-6 fw-bold text-primary">
                    {{ (isAdmin$ | async) ? (stats$ | async)?.total_users : (stats$ | async)?.active_students || 0 }}
                  </h2>
                  <a *ngIf="isAdmin$ | async" routerLink="/admin/users" class="btn btn-link btn-sm p-0">Manage Users</a>
                  <span *ngIf="isInstructor$ | async" class="small text-muted">Across your exams</span>
               </div>
            </div>
         </div>
         <div class="col-md-3 mb-4">
            <div class="card h-100 shadow-sm border-0 border-top border-4 border-success hover-card">
               <div class="card-body text-center">
                  <h6 class="text-muted text-uppercase small">{{ (isAdmin$ | async) ? "Total Exams" : "My Exams" }}</h6>
                  <h2 class="display-6 fw-bold text-success">{{ (stats$ | async)?.total_exams || 0 }}</h2>
                  <a routerLink="/exams" class="btn btn-link btn-sm p-0">View Exams</a>
               </div>
            </div>
         </div>
         <div class="col-md-3 mb-4">
            <div class="card h-100 shadow-sm border-0 border-top border-4 border-warning hover-card">
               <div class="card-body text-center">
                  <h6 class="text-muted text-uppercase small">{{ (isAdmin$ | async) ? "Total Attempts" : "Total Results" }}</h6>
                  <h2 class="display-6 fw-bold text-warning">{{ (stats$ | async)?.total_attempts || 0 }}</h2>
                  <span *ngIf="isInstructor$ | async" class="small text-muted">Completed & Draft</span>
               </div>
            </div>
         </div>
         <div class="col-md-3 mb-4">
            <div class="card h-100 shadow-sm border-0 border-top border-4 border-danger hover-card">
               <div class="card-body text-center">
                  <h6 class="text-muted text-uppercase small">{{ (isAdmin$ | async) ? "System Status" : "Today's Activity" }}</h6>
                  <h2 *ngIf="isAdmin$ | async" class="h4 mt-2 text-success fw-bold"><i class="bi bi-shield-check"></i> {{ (stats$ | async)?.system_status || 'ONLINE' }}</h2>
                  <h2 *ngIf="isInstructor$ | async" class="display-6 fw-bold text-danger">{{ (stats$ | async)?.completed_today || 0 }}</h2>
                  <a *ngIf="isAdmin$ | async" routerLink="/admin/audit-logs" class="btn btn-link btn-sm p-0">View Logs</a>
                  <span *ngIf="isInstructor$ | async" class="small text-muted">Completed today</span>
               </div>
            </div>
         </div>
         <div class="col-md-12 mb-4">
            <div class="card bg-light border-0 shadow-sm">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Platform Administration</h5>
                        <p class="text-secondary mb-0 small">Access advanced system settings and Django admin.</p>
                    </div>
                    <a href="http://localhost:8000/admin" target="_blank" class="btn btn-primary shadow-sm">
                        <i class="bi bi-box-arrow-up-right me-1"></i> Open Django Admin
                    </a>
                </div>
            </div>
         </div>
      </div>

      <!-- INSTRUCTOR DASHBOARD -->
      <!-- INSTRUCTOR DASHBOARD -->
      <div *ngIf="isInstructor$ | async" class="row">
         
         <!-- Live Monitor Section -->
         <div class="col-md-12 mb-4">
             <div class="card shadow-sm border-0 border-top border-4 border-info">
                 <div class="card-header bg-white d-flex justify-content-between align-items-center">
                     <h5 class="mb-0 text-info"><i class="bi bi-broadcast me-2"></i> Live Exam Monitor</h5>
                     <span class="badge bg-light text-dark border">Auto-refreshing (10s)</span>
                 </div>
                 <div class="card-body p-0">
                     <div class="table-responsive">
                         <table class="table table-hover mb-0 align-middle">
                             <thead class="bg-light">
                                 <tr>
                                     <th>Student</th>
                                     <th>Exam</th>
                                     <th>Started At</th>
                                     <th>Violations</th>
                                     <th>Status</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <ng-container *ngIf="liveAttempts$ | async as attempts">
                                     <tr *ngFor="let att of attempts">
                                         <td class="fw-bold">{{ att.user_details?.username || 'Student' }}</td>
                                         <td>{{ att.exam_title }}</td>
                                         <td>{{ att.start_time | date:'shortTime' }}</td>
                                         <td>
                                             <span class="badge" [class.bg-danger]="att.violation_count > 0" [class.bg-success]="att.violation_count === 0">
                                                 {{ att.violation_count || 0 }}
                                             </span>
                                         </td>
                                         <td><span class="spinner-grow spinner-grow-sm text-success me-1"></span> Live</td>
                                     </tr>
                                     <tr *ngIf="attempts.length === 0">
                                         <td colspan="5" class="text-center py-4 text-muted">No students currently taking exams.</td>
                                     </tr>
                                 </ng-container>
                             </tbody>
                         </table>
                     </div>
                 </div>
             </div>
         </div>

         <!-- Exam Results Section -->
         <div class="col-md-12">
            <div class="card shadow-sm border-0">
               <div class="card-header bg-white pt-3">
                  <h5 class="mb-0">Recent Exam Results</h5>
               </div>
               <div class="table-responsive">
                   <table class="table table-hover mb-0">
                       <thead class="bg-light">
                           <tr>
                               <th>Student</th>
                               <th>Exam</th>
                               <th>Finished At</th>
                               <th>Score</th>
                               <th>Action</th>
                           </tr>
                       </thead>
                       <tbody>
                           <ng-container *ngIf="recentResults$ | async as results">
                               <tr *ngFor="let res of results | slice:0:10">
                                   <td>{{ res.user_details?.username || 'Student' }}</td>
                                   <td>{{ res.exam_title }}</td>
                                   <td>{{ res.finish_time | date:'short' }}</td>
                                   <td>
                                       <span class="fw-bold" [class.text-success]="res.score >= (res.exam_pass_marks || 0)" [class.text-danger]="res.score < (res.exam_pass_marks || 0)">
                                           {{ res.score }}
                                       </span>
                                        / {{ res.exam_total_marks || 'N/A' }}
                                   </td>
                                   <td>
                                       <a [routerLink]="['/attempts', res.id, 'review']" class="btn btn-sm btn-outline-primary">Review</a>
                                   </td>
                               </tr>
                               <tr *ngIf="results.length === 0">
                                   <td colspan="5" class="text-center py-4 text-muted">No completed exams found.</td>
                               </tr>
                           </ng-container>
                       </tbody>
                   </table>
               </div>
            </div>
         </div>
      </div>

      <!-- STUDENT DASHBOARD -->
      <div *ngIf="isStudent$ | async" class="row">
         <div class="col-md-8 mb-4">
            <div class="card shadow-sm border-0">
               <div class="card-header bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Available Exams</h5>
                  <a routerLink="/exams" class="btn btn-sm btn-outline-primary">View All</a>
               </div>
               <div class="card-body">
                  <div class="row">
                      <ng-container *ngIf="availableExams$ | async as exams">
                          <div class="col-md-6 mb-3" *ngFor="let exam of exams | slice:0:4">
                              <div class="card h-100 bg-light border-0 hover-card">
                                  <div class="card-body">
                                      <h6 class="card-title fw-bold">{{ exam.title }}</h6>
                                      <p class="card-text small text-muted">{{ exam.description | slice:0:80 }}...</p>
                                      <a [routerLink]="['/attempts/exam', exam.id, 'start']" class="btn btn-sm btn-success w-100 shadow-sm">Take Exam</a>
                                  </div>
                              </div>
                          </div>
                          <div *ngIf="exams.length === 0" class="col-12 text-center py-4 text-muted">No exams available right now.</div>
                      </ng-container>
                  </div>
               </div>
            </div>
         </div>
         <div class="col-md-4">
            <div class="card shadow-sm border-0 h-100">
               <div class="card-header bg-white border-bottom-0 pt-3">
                  <h5 class="mb-0">My Progress</h5>
               </div>
               <div class="card-body text-center py-5">
                   <div class="mb-3">
                       <i class="bi bi-trophy text-warning display-4"></i>
                   </div>
                   <h3 class="text-success fw-bold">Ready to Start</h3>
                   <p class="text-muted mb-4">Complete exams to see your performance stats and analytics.</p>
                   <a routerLink="/attempts" class="btn btn-outline-primary btn-sm">View Attempt History</a>
               </div>
            </div>
         </div>
      </div>
    </div>
  `,
   styles: [`
    .hover-card { transition: transform 0.2s, box-shadow 0.2s; }
    .hover-card:hover { transform: translateY(-5px); box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }
    .bg-gradient { background: linear-gradient(135deg, #2c3e50, #3498db); }
  `]
})
export class DashboardComponent implements OnInit {
   isInstructor$: Observable<boolean>;
   isStudent$: Observable<boolean>;
   isAdmin$: Observable<boolean>;

   recentExams$: Observable<any[]> = of([]);
   availableExams$: Observable<any[]> = of([]);
   stats$: Observable<any> = of(null);

   recentResults$: Observable<any[]> = of([]);
   liveAttempts$: Observable<any[]> = of([]);

   // Polling subscription
   private pollSub: any;

   constructor(
      public authService: AuthService,
      private examService: ExamService,
      private adminService: AdminService,
      private attemptService: AttemptService
   ) {
      const userRole$ = this.authService.currentUser$.pipe(catchError(() => of(null)));

      this.isInstructor$ = userRole$.pipe(map(u => u?.role_name === 'INSTRUCTOR'));
      this.isStudent$ = userRole$.pipe(map(u => u?.role_name === 'STUDENT'));
      this.isAdmin$ = userRole$.pipe(map(u => u?.role_name === 'ADMIN'));
   }

   ngOnInit(): void {
      this.authService.currentUser$.subscribe(user => {
         if (user?.role_name === 'INSTRUCTOR') {
            this.startInstructorPolling();
            this.stats$ = this.adminService.getPlatformStats().pipe(
               catchError(() => of(null))
            );
         } else if (user?.role_name === 'STUDENT') {
            this.availableExams$ = this.examService.getExams().pipe(
               catchError(() => of({ results: [] })),
               map((res: any) => res.results || res)
            );
         } else if (user?.role_name === 'ADMIN') {
            this.stats$ = this.adminService.getPlatformStats().pipe(
               catchError(() => of(null))
            );
         }
      });
   }

   ngOnDestroy() {
      if (this.pollSub) {
         clearInterval(this.pollSub);
      }
   }

   startInstructorPolling() {
      this.loadInstructorData();
      // Poll every 10 seconds for live updates
      this.pollSub = setInterval(() => {
         this.loadInstructorData();
      }, 10000);
   }

   loadInstructorData() {
      this.attemptService.getAllAttempts().subscribe({
         next: (attempts: any[]) => {
            // Filter for Live Monitor
            const live = attempts.filter(a => a.status === 'STARTED');
            this.liveAttempts$ = of(live);

            // Filter for Results
            const results = attempts.filter(a => a.status === 'COMPLETED' || a.status === 'TIMEOUT');
            // Sort by finish time desc
            results.sort((a, b) => new Date(b.finish_time!).getTime() - new Date(a.finish_time!).getTime());
            this.recentResults$ = of(results);
         },
         error: () => console.error('Failed to load instructor data')
      });
   }
}
