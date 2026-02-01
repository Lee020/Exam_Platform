import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AttemptService, Attempt } from '../../services/attempt.service';
import { SecurityService } from '../../../core/services/security.service';
import { TranslationService } from '../../../core/services/translation.service';
import { AuthService } from '../../../auth/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-take-exam',
    template: `
    <div class="container mt-4" *ngIf="attempt">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded shadow-sm">
        <h4 class="mb-0">{{ attempt.exam_title }}</h4>
        <div class="fs-4 fw-bold" [class.text-danger]="timeRemaining < 60">
          {{ ts.translate('LBL_TIME_LEFT') }}: {{ formatTime(timeRemaining) }}
        </div>
        <div>
          <button class="btn btn-outline-info btn-sm me-2" (click)="mockOfflineSync()" *ngIf="attempt.is_offline_capable">
                <i class="bi bi-cloud-arrow-down"></i> Save for Offline
          </button>
          <select class="form-select form-select-sm d-inline-block w-auto me-2" (change)="ts.setLanguage($any($event.target).value)">
            <option value="EN">English</option>
            <option value="TE">Telugu</option>
          </select>
          <button class="btn btn-danger" (click)="finishExam()">{{ ts.translate('BTN_SUBMIT') }}</button>
        </div>
      </div>

      <!-- Question Area -->
      <div class="card shadow-sm" *ngIf="currentQuestion">
        <div class="card-header bg-white">
          <div class="d-flex justify-content-between">
            <span class="badge bg-secondary">Question {{ currentIndex + 1 }} of {{ questions.length }}</span>
            <span class="badge bg-info text-dark" *ngIf="savedAnswers[currentQuestion.id]">Saved</span>
          </div>
          <h5 class="mt-3">{{ currentQuestion.title }}</h5>
        </div>
        
        <div class="card-body">
          <p class="lead" [innerHTML]="currentQuestion.question_text"></p>
          
          <!-- MCQ / True-False -->
          <div class="list-group" *ngIf="currentQuestion.question_type !== 'DESCRIPTIVE'">
            <div *ngFor="let choice of currentQuestion.choices" 
              class="list-group-item list-group-item-action cursor-pointer"
              [class.active]="currentAnswer === choice.id"
              (click)="selectAnswer(choice.id)">
              {{ choice.text }}
            </div>
          </div>

          <!-- Descriptive -->
          <div *ngIf="currentQuestion.question_type === 'DESCRIPTIVE'">
             <label class="form-label fw-bold">Your Answer:</label>
             <textarea class="form-control" rows="8" 
                       placeholder="Type your detailed answer here..."
                       [value]="savedAnswers[currentQuestion.id] || ''"
                       (input)="onTextAnswerInput($event, currentQuestion.id)">
             </textarea>
             <div class="form-text mt-2 text-primary">
                <i class="bi bi-info-circle"></i> This is a descriptive question. Your answer will be evaluated based on content and detail.
             </div>
          </div>
        </div>
        
        <div class="card-footer d-flex justify-content-between">
          <button class="btn btn-secondary" [disabled]="currentIndex === 0" (click)="prevQuestion()">Previous</button>
          <button class="btn btn-primary" [disabled]="currentIndex === questions.length - 1" (click)="nextQuestion()">Next</button>
        </div>
      </div>
      
      <div *ngIf="!attempt.is_active" class="alert alert-warning mt-3">
          This attempt is not active (Status: {{ attempt.status }}). Redirecting...
      </div>

            <!-- AI PROCTORING MOCK -->
            <div class="position-fixed bottom-0 end-0 m-3 p-3 bg-dark text-white rounded shadow-lg border border-primary animate-pulse" style="width: 250px; z-index: 9999; border-width: 2px !important;">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <div class="spinner-grow spinner-grow-sm text-danger me-2" role="status"></div>
                        <span class="small fw-bold letter-spacing-1">AI PROCTOR ACTIVE</span>
                    </div>
                </div>

                <div class="bg-black rounded p-2 text-center mb-3 border border-secondary" style="height: 140px; position: relative; overflow: hidden;">
                    <div class="position-absolute w-100 h-100 top-0 start-0 opacity-20" style="background-image: radial-gradient(#00ff00 1px, transparent 1px); background-size: 15px 15px;"></div>
                    <i class="bi bi-person-bounding-box fs-1 text-primary opacity-75"></i>
                    
                    <!-- HUD Overlays -->
                    <div class="position-absolute border border-success" 
                        style="width: 80px; height: 100px; border-width: 2px !important; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0.8;"
                        [style.top.%]="scanTop" [style.left.%]="scanLeft">
                        <div class="position-absolute p-1 bg-success text-black small fw-bold" style="top: -20px; left: 0; font-size: 0.5rem; white-space: nowrap;">
                            FACE: {{ userName.toUpperCase() }} (MATCH 98%)
                        </div>
                    </div>

                    <div class="position-absolute bottom-0 start-0 w-100 p-1 bg-dark bg-opacity-75" style="font-size: 0.6rem;">
                        <div class="row g-0">
                            <div class="col-6 text-success"><i class="bi bi-eye-fill"></i> GAZE: CENTER</div>
                            <div class="col-6 text-info"><i class="bi bi-record-circle-fill text-danger animate-pulse"></i> REC: ON</div>
                        </div>
                    </div>
                </div>

                <div class="proctor-log small mb-2" style="max-height: 80px; overflow-y: auto; font-family: monospace; font-size: 0.7rem;">
                    <div class="text-secondary border-bottom border-secondary mb-1 pb-1">SECURITY EVENT LOG</div>
                    <div *ngFor="let log of proctoringLog" class="mb-1" [class.text-danger]="log.type==='VIOLATION'" [class.text-info]="log.type==='STATUS'">
                        [{{ log.time }}] {{ log.msg }}
                    </div>
                </div>

        <div class="d-flex justify-content-between align-items-center opacity-75" style="font-size: 0.65rem;">
           <span>Violations: <b class="text-danger">{{ attempt.violation_count }}/3</b></span>
           <span class="text-success"><i class="bi bi-shield-lock-fill"></i> Secure</span>
        </div>
      </div>

      <!-- Custom Submit Confirmation Modal -->
      <div *ngIf="showSubmitConfirm" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.8); z-index: 10000;">
        <div class="bg-white rounded p-4 shadow-lg" style="max-width: 400px;">
          <h5 class="mb-3">Submit Exam?</h5>
          <p class="mb-4">Are you sure you want to submit your exam? This action cannot be undone.</p>
          <div class="d-flex gap-2 justify-content-end">
            <button class="btn btn-secondary" (click)="cancelSubmit()">Cancel</button>
            <button class="btn btn-danger" (click)="confirmSubmit()">Submit Exam</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .letter-spacing-1 { letter-spacing: 1px; }
    .animate-pulse { animation: border-pulse 2s infinite; }
    @keyframes border-pulse {
      0% { border-color: rgba(13, 110, 253, 0.5); }
      50% { border-color: rgba(13, 110, 253, 1); }
      100% { border-color: rgba(13, 110, 253, 0.5); }
    }
    .proctor-log::-webkit-scrollbar { width: 3px; }
    .proctor-log::-webkit-scrollbar-thumb { background: #444; }
    .cursor-pointer { cursor: pointer; }
  `]
})
export class TakeExamComponent implements OnInit, OnDestroy {
    attemptId: string | null = null;
    examId: string | null = null;
    attempt: Attempt | null = null;
    questions: any[] = [];
    currentIndex = 0;
    timeRemaining = 0;
    timerSub: Subscription | null = null;

    // AI Mock state
    userName = 'Student';
    isFaceDetected = true;
    scanTop = 20;
    scanLeft = 35;
    proctoringLog: { time: string, msg: string, type: 'VIOLATION' | 'STATUS' }[] = [];

    // Local state
    savedAnswers: { [key: string]: string } = {}; // questionId -> choiceId
    private violationSub: Subscription | null = null;
    showSubmitConfirm = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private attemptService: AttemptService,
        private securityService: SecurityService,
        private authService: AuthService,
        public ts: TranslationService
    ) { }

    get currentQuestion() {
        return this.questions[this.currentIndex];
    }

    get currentAnswer() {
        return this.savedAnswers[this.currentQuestion?.id];
    }

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (user) {
            this.userName = user.username;
        }
        // We expect route to be /attempts/start/:examId or /attempts/:attemptId
        // But logic: User clicks "Start Exam" on ExamList.
        // Ideally ExamList should link to a component that calls startAttempt.
        // Let's assume the route is /attempts/take/:attemptId 
        // AND there is a route /attempts/start/:examId that redirects to take.

        // For simplicity, let's say param is attemptId. Creating attempt is done elsewhere?
        // Actually, implementation plan said: "Create API for Starting".
        // Let's support both or just one.
        // Let's make the route /attempts/exam/:examId/start which calls API and then shows UI.

        const examId = this.route.snapshot.paramMap.get('examId');
        if (examId) {
            this.startNewAttempt(examId);
        } else {
            const attemptId = this.route.snapshot.paramMap.get('attemptId');
            if (attemptId) this.loadAttempt(attemptId);
        }
    }

    startNewAttempt(examId: string): void {
        this.attemptService.startAttempt(examId).subscribe({
            next: (att: Attempt) => {
                this.attempt = att;
                this.questions = att.questions || [];
                this.startTimer();
                this.startSecurity();
                this.startAIProctoring();
            },
            error: (err: any) => alert('Failed to start exam: ' + (err.error?.detail || 'Unknown error'))
        });
    }

    loadAttempt(id: string): void {
        this.attemptService.getAttempt(id).subscribe((att: Attempt) => {
            this.attempt = att;
            this.questions = att.questions || [];
            if (att.status !== 'STARTED') {
                this.router.navigate(['/attempts/result', att.id]);
            } else {
                this.startTimer();
                this.startSecurity();
                this.startAIProctoring();
            }
        });
    }

    private getTimestamp(): string {
        const now = new Date();
        return now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    startAIProctoring(): void {
        setInterval(() => {
            this.scanTop = 15 + Math.random() * 10;
            this.scanLeft = 25 + Math.random() * 20;
            this.isFaceDetected = Math.random() > 0.05; // 95% face detected

            if (this.isFaceDetected && Math.random() > 0.8) {
                this.proctoringLog.unshift({
                    time: this.getTimestamp(),
                    msg: 'Face Verified',
                    type: 'STATUS'
                });
                if (this.proctoringLog.length > 20) this.proctoringLog.pop();
            }
        }, 3000);
    }

    startSecurity(): void {
        this.securityService.startMonitoring();
        this.securityService.requestFullscreen();

        this.violationSub = this.securityService.onViolation.subscribe(type => {
            this.handleViolation(type);
        });
    }

    handleViolation(type: any): void {
        if (!this.attempt) return;

        this.proctoringLog.unshift({
            time: this.getTimestamp(),
            msg: `Violation: ${type}`,
            type: 'VIOLATION'
        });

        this.attemptService.recordViolation(this.attempt.id).subscribe({
            next: (res: any) => {
                if (res.status === 'terminated') {
                    alert('Exam terminated due to multiple security violations.');
                    this.finishExam(true);
                } else {
                    this.attempt!.violation_count = res.count;
                    alert('Warning: Security violation detected (' + type + '). Please stay in fullscreen and do not switch tabs.');
                }
            }
        });
    }

    startTimer(): void {
        if (!this.attempt) return;

        this.timeRemaining = this.attempt.seconds_remaining || 3600;

        this.timerSub = interval(1000).subscribe(() => {
            if (this.timeRemaining > 0) {
                this.timeRemaining--;
            } else {
                this.finishExam(true);
            }
        });
    }

    selectAnswer(choiceId: string): void {
        if (!this.currentQuestion) return;
        const qId = this.currentQuestion.id;
        this.savedAnswers[qId] = choiceId;

        this.attemptService.submitAnswer(this.attempt!.id, qId, choiceId).subscribe({
            next: (res: any) => {
                if (res.next_question_id) {
                    this.handleAdaptiveJump(res.next_question_id);
                }
            },
            error: (err) => console.error('Error saving answer', err)
        });
    }

    handleAdaptiveJump(nextQuestionId: string): void {
        const nextIdx = this.questions.findIndex(q => q.id === nextQuestionId);
        if (nextIdx !== -1 && nextIdx !== this.currentIndex) {
            this.currentIndex = nextIdx;
            this.proctoringLog.unshift({
                time: this.getTimestamp(),
                msg: `Adaptive Jump to Q${nextIdx + 1}`,
                type: 'STATUS'
            });
        }
    }

    nextQuestion(): void {
        if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
    }

    onTextAnswerInput(event: any, questionId: string): void {
        const text = event.target.value;
        this.savedAnswers[questionId] = text;

        // In a real app, we'd debounce this. For now, let's submit on every change or on blur.
        // Let's submit to backend
        if (this.attempt) {
            this.attemptService.submitAnswer(this.attempt.id, questionId, undefined, text).subscribe({
                next: (res: any) => {
                    if (res.next_question_id) {
                        this.handleAdaptiveJump(res.next_question_id);
                    }
                },
                error: (err: any) => console.error('Error saving descriptive answer', err)
            });
        }
    }

    prevQuestion(): void {
        if (this.currentIndex > 0) this.currentIndex--;
    }

    finishExam(autoSubmitting: boolean = false): void {
        if (!this.attempt) return;

        if (autoSubmitting) {
            this.submitExamNow();
        } else {
            // Show custom confirmation instead of browser confirm()
            this.showSubmitConfirm = true;
        }
    }

    confirmSubmit(): void {
        this.showSubmitConfirm = false;
        this.submitExamNow();
    }

    cancelSubmit(): void {
        this.showSubmitConfirm = false;
    }

    private submitExamNow(): void {
        if (!this.attempt) return;
        this.attemptService.finishAttempt(this.attempt.id).subscribe(() => {
            // Navigate first, then stop monitoring to avoid premature full-screen exit
            this.router.navigate(['/attempts/result', this.attempt?.id]).then(() => {
                // Only stop monitoring after navigation is complete
                this.securityService.stopMonitoring();
            });
        });
    }

    mockOfflineSync(): void {
        alert('Caching all questions and assets locally... Success! You can now continue the exam if your connection is lost.');
        this.proctoringLog.unshift({
            time: this.getTimestamp(),
            msg: 'Offline Sync: READY',
            type: 'STATUS'
        });
    }

    formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    ngOnDestroy(): void {
        if (this.timerSub) this.timerSub.unsubscribe();
        if (this.violationSub) this.violationSub.unsubscribe();
        this.securityService.stopMonitoring();
    }
}
