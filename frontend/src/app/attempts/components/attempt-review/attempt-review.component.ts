import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AttemptService } from '../../services/attempt.service';

@Component({
  selector: 'app-attempt-review',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0">Review: {{ review?.exam_title }}</h2>
          <p class="text-muted">Total Score: {{ review?.score }} points</p>
        </div>
        <button class="btn btn-outline-secondary" (click)="goBack()">Back</button>
      </div>

      <div class="row">
        <div class="col-md-12">
          <div *ngFor="let ans of review?.answers; let i = index" class="card mb-3 shadow-sm" [class.border-success]="ans.is_correct" [class.border-danger]="!ans.is_correct">
            <div class="card-header d-flex justify-content-between align-items-center" [class.bg-success-subtle]="ans.is_correct" [class.bg-danger-subtle]="!ans.is_correct">
              <h5 class="mb-0">Question {{ i + 1 }}</h5>
              <span class="badge" [class.bg-success]="ans.is_correct" [class.bg-danger]="!ans.is_correct">
                {{ ans.marks_awarded }} / {{ getQuestionMaxMarks(ans) }} marks
              </span>
            </div>
            <div class="card-body">
              <p class="fw-bold">{{ ans.question?.question_text }}</p>
              
              <!-- Choice-based Answer -->
              <div class="list-group" *ngIf="ans.question?.question_type !== 'DESCRIPTIVE'">
                <div *ngFor="let choice of ans.question?.choices" 
                     class="list-group-item d-flex justify-content-between align-items-center"
                     [class.list-group-item-success]="choice.is_correct"
                     [class.list-group-item-danger]="choice.id === ans.selected_choice_id && !choice.is_correct"
                     [class.selected-bg]="choice.id === ans.selected_choice_id">
                  
                  <span>
                    <i class="bi me-2" [class.bi-check-circle-fill]="choice.is_correct" [class.bi-x-circle-fill]="choice.id === ans.selected_choice_id && !choice.is_correct" [class.bi-circle]="choice.id !== ans.selected_choice_id && !choice.is_correct"></i>
                    {{ choice.text }}
                  </span>
                  
                  <span class="badge bg-primary rounded-pill" *ngIf="choice.id === ans.selected_choice_id">Your Answer</span>
                  <span class="badge bg-success rounded-pill" *ngIf="choice.is_correct && choice.id !== ans.selected_choice_id">Correct Answer</span>
                </div>
              </div>

              <!-- Descriptive Answer -->
              <div *ngIf="ans.question?.question_type === 'DESCRIPTIVE'">
                <div class="p-3 bg-light rounded border mb-3">
                    <label class="small text-muted fw-bold">YOUR SUBMISSION:</label>
                    <p class="mb-0 italic">{{ ans.answer_text || 'No answer provided.' }}</p>
                </div>
                
                <div class="alert alert-info border-info" *ngIf="ans.feedback">
                    <h6 class="alert-heading small fw-bold"><i class="bi bi-robot"></i> AI EVALUATION & FEEDBACK:</h6>
                    <hr class="my-2">
                    <p class="mb-0 small">{{ ans.feedback }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-success-subtle { background-color: #d1e7dd; }
    .bg-danger-subtle { background-color: #f8d7da; }
    .selected-bg { border: 2px solid #0d6efd; z-index: 10; }
  `]
})
export class AttemptReviewComponent implements OnInit {
  review: any = null;

  constructor(
    private route: ActivatedRoute,
    private attemptService: AttemptService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.attemptService.getAttemptReview(id).subscribe({
        next: (res) => this.review = res,
        error: (err) => console.error('Review load error', err)
      });
    }
  }

  getQuestionMaxMarks(ans: any): number {
    // This is optional if we want to show denominator. 
    // For simplicity, we assume sum of awarded marks is enough for now.
    return 1;
  }

  goBack(): void {
    window.history.back();
  }
}
