import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-exam-form',
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>{{ isEditMode ? 'Edit Exam' : 'Create Exam' }}</h2>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
        {{ errorMessage }}
        <button type="button" class="btn-close" (click)="errorMessage = ''" aria-label="Close"></button>
      </div>

      <form [formGroup]="examForm" (ngSubmit)="onSubmit()">
        <div class="mb-3">
          <label class="form-label">Title</label>
          <input type="text" class="form-control" formControlName="title">
        </div>

        <div class="mb-3">
          <label class="form-label">Description</label>
          <textarea class="form-control" formControlName="description"></textarea>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Duration (minutes)</label>
            <input type="number" class="form-control" formControlName="duration_minutes">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Pass Marks</label>
            <input type="number" class="form-control" formControlName="pass_marks">
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Negative Marking (Penalty per wrong answer)</label>
            <input type="number" step="0.25" class="form-control" formControlName="negative_marking" placeholder="e.g. 0.25">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Status</label>
            <select class="form-select" formControlName="status">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="partialCheck" formControlName="partial_scoring">
            <label class="form-check-label" for="partialCheck">Enable Partial Scoring (For multiple correct questions)</label>
        </div>

        <div class="mb-3 form-check">
           <input type="checkbox" class="form-check-input" id="shuffleCheck" formControlName="shuffle_questions">
           <label class="form-check-label" for="shuffleCheck">Shuffle Questions (Random order for each student)</label>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3 form-check ps-5">
            <input type="checkbox" class="form-check-input" id="adaptiveCheck" formControlName="is_adaptive">
            <label class="form-check-label" for="adaptiveCheck">
              <strong>Adaptive Exam</strong> (Difficulty branches based on performance)
            </label>
          </div>
          <div class="col-md-6 mb-3 form-check ps-5">
            <input type="checkbox" class="form-check-input" id="offlineCheck" formControlName="is_offline_capable">
            <label class="form-check-label" for="offlineCheck">
              <strong>Offline Mode</strong> (Allow taking exam without stable internet)
            </label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="examForm.invalid">Save</button>
        <a routerLink="/exams" class="btn btn-secondary ms-2">Cancel</a>
      </form>
    </div>
  `
})
export class ExamFormComponent implements OnInit {
  examForm: FormGroup;
  isEditMode = false;
  examId: string | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private examService: ExamService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      duration_minutes: [60, [Validators.required, Validators.min(1)]],
      pass_marks: [40, [Validators.required, Validators.min(0)]],
      negative_marking: [0, [Validators.min(0)]],
      partial_scoring: [false],
      status: ['DRAFT', Validators.required],
      shuffle_questions: [false],
      is_adaptive: [false],
      is_offline_capable: [false]
    });
  }

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id');
    if (this.examId) {
      this.isEditMode = true;
      this.examService.getExam(this.examId).subscribe(exam => {
        this.examForm.patchValue(exam);
      });
    }
  }

  onSubmit(): void {
    if (this.examForm.invalid) return;

    const examData = this.examForm.value;
    this.errorMessage = '';

    if (this.isEditMode && this.examId) {
      this.examService.updateExam(this.examId, examData).subscribe({
        next: () => this.router.navigate(['/exams']),
        error: (err: any) => {
          this.errorMessage = err.message || 'Failed to update exam. Please try again.';
          console.error('Update exam error', err);
        }
      });
    } else {
      this.examService.createExam(examData).subscribe({
        next: () => this.router.navigate(['/exams']),
        error: (err: any) => {
          this.errorMessage = err.message || 'Failed to create exam. Please try again.';
          console.error('Create exam error', err);
        }
      });
    }
  }
}
