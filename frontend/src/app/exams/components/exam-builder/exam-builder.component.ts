import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ExamService, Exam } from '../../services/exam.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-exam-builder',
  template: `
    <div class="container mt-4" *ngIf="exam">
      <!-- Exam Meta Editing Section -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Exam Configuration</h4>
            <button class="btn btn-primary btn-sm" (click)="toggleMetaEdit()">
                {{ isEditingMeta ? 'Cancel Edit' : 'Edit Details' }}
            </button>
        </div>
        <div class="card-body">
            <div *ngIf="!isEditingMeta">
                <h2>{{ exam.title }}</h2>
                <p class="text-muted">{{ exam.description }}</p>
                <div class="d-flex gap-4">
                    <span><strong>Duration:</strong> {{ exam.duration_minutes }} mins</span>
                    <span class="ms-3"><strong>Pass Marks:</strong> {{ exam.pass_marks }}</span>
                    <span class="ms-3"><strong>Total Marks:</strong> {{ exam.total_marks }}</span>
                    <span><strong>Status:</strong> 
                        <span [class.text-success]="exam.status === 'PUBLISHED'" [class.text-warning]="exam.status === 'DRAFT'">{{ exam.status }}</span>
                    </span>
                </div>
            </div>
            
            <div *ngIf="isEditingMeta">
                <div class="mb-3">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-control" [(ngModel)]="exam.title">
                </div>
                <div class="mb-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" [(ngModel)]="exam.description"></textarea>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Duration (mins)</label>
                        <input type="number" class="form-control" [(ngModel)]="exam.duration_minutes">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Pass Marks</label>
                        <input type="number" class="form-control" [(ngModel)]="exam.pass_marks">
                    </div>
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" [(ngModel)]="exam.status">
                            <option value="DRAFT">Draft</option>
                            <option value="PUBLISHED">Published</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-success" (click)="saveMeta()">Save Changes</button>
            </div>
        </div>
      </div>

      <div class="row">
        <!-- Questions in Exam -->
        <div class="col-md-7">
          <div class="card mb-4">
            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Selected Questions ({{ exam.exam_questions?.length || 0 }})</h5>
              <button class="btn btn-light btn-sm fw-bold" (click)="quickCreateQuestion()">+ Quick Create</button>
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item" *ngFor="let eq of examQuestions">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <strong>{{ eq.question_details?.title }}</strong>
                        <br>
                        <small class="text-muted">{{ eq.question_details?.question_text | slice:0:50 }}...</small>
                    </div>
                    <button class="btn btn-sm btn-danger ms-2" (click)="removeQuestion(eq.question_details.id)">X</button>
                </div>
                
                <!-- Inline Edit for Content/Marks/Order -->
                <div class="mt-2 p-3 bg-light rounded border">
                    <div class="row g-2 mb-2">
                        <div class="col-md-9">
                            <label class="small fw-bold">Question Title</label>
                            <input type="text" class="form-control form-control-sm" [(ngModel)]="eq.question_details.title">
                        </div>
                        <div class="col-md-3">
                            <label class="small fw-bold">Type</label>
                            <select class="form-select form-select-sm" [(ngModel)]="eq.question_details.question_type">
                                <option value="MCQ">MCQ</option>
                                <option value="TF">True/False</option>
                                <option value="DESCRIPTIVE">Descriptive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-2">
                        <label class="small fw-bold">Question Text</label>
                        <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="eq.question_details.question_text"></textarea>
                    </div>

                    <!-- Choices Management (Only for MCQ/TF) -->
                    <div class="mb-3" *ngIf="eq.question_details.question_type !== 'DESCRIPTIVE'">
                        <label class="small fw-bold d-block mb-1">Choices</label>
                        <div *ngFor="let ch of eq.question_details.choices; let chIdx = index" class="input-group input-group-sm mb-1">
                            <span class="input-group-text p-1">
                                <input type="checkbox" [(ngModel)]="ch.is_correct" (change)="toggleChoice(eq, chIdx)">
                            </span>
                            <input type="text" class="form-control" [(ngModel)]="ch.text" placeholder="Choice text">
                            <button class="btn btn-outline-danger" (click)="removeChoice(eq, chIdx)" [disabled]="eq.question_details.choices.length <= 2">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <button class="btn btn-sm btn-outline-primary mt-1" (click)="addChoice(eq)">
                            <i class="bi bi-plus-lg"></i> Add Choice
                        </button>
                    </div>

                    <div class="d-flex align-items-center gap-3">
                        <div class="input-group input-group-sm" style="width: 130px;">
                            <span class="input-group-text">Marks</span>
                            <input type="number" class="form-control" [(ngModel)]="eq.marks">
                        </div>
                        <div class="input-group input-group-sm" style="width: 130px;">
                            <span class="input-group-text">Order</span>
                            <input type="number" class="form-control" [(ngModel)]="eq.order">
                        </div>
                        <div class="ms-auto">
                            <button class="btn btn-sm btn-success" (click)="saveQuestion(eq)">
                                <i class="bi bi-check-lg"></i> Update Content & Config
                            </button>
                        </div>
                    </div>
                </div>
              </li>
              <li class="list-group-item" *ngIf="!examQuestions || examQuestions.length === 0">
                <span class="text-muted">No questions added yet.</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Available Questions -->
        <div class="col-md-5">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Question Bank</h5>
            </div>
            <div class="card-body">
               <div *ngIf="loadingQuestions" class="text-center">Loading...</div>
            </div>
            <ul class="list-group list-group-flush" *ngIf="!loadingQuestions" style="max-height: 600px; overflow-y: auto;">
              <li class="list-group-item d-flex justify-content-between align-items-center" *ngFor="let q of availableQuestions">
                <div>
                  <strong>{{ q.title }}</strong>
                  <span class="badge bg-secondary ms-2">{{ q.difficulty }}</span>
                  <br>
                  <small class="text-muted">{{ q.question_text | slice:0:30 }}...</small>
                </div>
                <button class="btn btn-sm btn-outline-primary" (click)="addQuestion(q)">Add</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="mt-3 mb-5">
          <a routerLink="/exams" class="btn btn-secondary">Back to Exams</a>
      </div>
    </div>
  `
})
export class ExamBuilderComponent implements OnInit {
  exam: Exam | null = null;
  examId: string | null = null;
  availableQuestions: any[] = [];
  loadingQuestions = false;
  examQuestions: any[] = [];

  isEditingMeta = false;
  totalMarks = 0;

  constructor(
    private route: ActivatedRoute,
    private examService: ExamService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.examId = this.route.snapshot.paramMap.get('id');
    if (this.examId) {
      this.loadExam();
      this.loadAvailableQuestions();
    }
  }

  loadExam(): void {
    if (!this.examId) return;
    this.examService.getExam(this.examId).subscribe((exam: any) => {
      this.exam = exam;
      this.examQuestions = exam.exam_questions || [];
      // Sort by order
      this.examQuestions.sort((a, b) => a.order - b.order);
    });
  }

  loadAvailableQuestions(): void {
    this.loadingQuestions = true;
    this.http.get<any>(`${environment.apiUrl}/questions/`).subscribe({
      next: (res: any) => {
        this.availableQuestions = res.results || res;
        this.loadingQuestions = false;
      },
      error: () => this.loadingQuestions = false
    });
  }

  addQuestion(question: any): void {
    if (!this.examId || !this.exam) return;

    const currentOrder = this.examQuestions.length > 0 ? Math.max(...this.examQuestions.map(q => q.order)) + 1 : 1;

    const payload = {
      question_id: question.id,
      marks: 5,
      order: currentOrder
    };

    this.examService.addQuestionToExam(this.examId, payload).subscribe({
      next: () => {
        this.loadExam(); // Reload to see change
      },
      error: (err) => alert('Failed to add question')
    });
  }

  removeQuestion(questionId: string): void {
    if (!this.examId) return;
    this.examService.removeQuestionFromExam(this.examId, questionId).subscribe({
      next: () => {
        this.loadExam();
      },
      error: (err) => alert('Failed to remove question')
    });
  }

  toggleMetaEdit(): void {
    if (this.isEditingMeta) {
      // Cancel: reload to reset changes
      this.loadExam();
    }
    this.isEditingMeta = !this.isEditingMeta;
  }

  saveMeta(): void {
    if (!this.examId || !this.exam) return;
    this.examService.updateExam(this.examId, this.exam).subscribe({
      next: (updatedExam: any) => {
        this.exam = updatedExam;
        this.isEditingMeta = false;
        alert('Exam details updated!');
      },
      error: () => alert('Failed to update exam details')
    });
  }

  addChoice(eq: any): void {
    if (!eq.question_details.choices) eq.question_details.choices = [];
    eq.question_details.choices.push({ text: '', is_correct: false });
  }

  removeChoice(eq: any, idx: number): void {
    eq.question_details.choices.splice(idx, 1);
  }

  toggleChoice(eq: any, idx: number): void {
    // If MCQ or TF, only one choice can be correct
    if (eq.question_details.question_type === 'MCQ' || eq.question_details.question_type === 'TF') {
      eq.question_details.choices.forEach((c: any, i: number) => {
        if (i !== idx) c.is_correct = false;
      });
    }
  }

  saveQuestion(eq: any): void {
    const questionId = eq.question_details.id;
    const questionData = {
      title: eq.question_details.title,
      question_text: eq.question_details.question_text,
      question_type: eq.question_details.question_type,
      choices: eq.question_details.choices // Include choices for nested update
    };

    // Validation
    const choices = eq.question_details.choices || [];
    const type = eq.question_details.question_type;
    const correctCount = choices.filter((c: any) => c.is_correct).length;

    if (type === 'MCQ') {
      if (choices.length < 2) {
        alert('Multiple Choice Questions must have at least 2 options.');
        return;
      }
      if (correctCount !== 1) {
        alert('Please select exactly one correct answer.');
        return;
      }
    } else if (type === 'TF') {
      if (choices.length !== 2) {
        alert('True/False questions must have exactly 2 options.');
        return;
      }
      if (correctCount !== 1) {
        alert('Please select True or False as the correct answer.');
        return;
      }
    }

    // 1. Update full question content (including choices)
    this.examService.updateQuestion(questionId, questionData).subscribe({
      next: (updatedQ: any) => {
        // If a new version was created (different ID), we need to update our reference
        // Note: In a real app we might need to swap the question in the ExamQuestion list
        // For now, let's assume simple updates.

        // 2. Update exam-specific config (marks, order)
        this.examService.updateExamQuestion(eq.id, { marks: eq.marks, order: eq.order }).subscribe({
          next: () => {
            alert('Question content, choices, and exam config updated successfully!');
            this.examQuestions.sort((a, b) => a.order - b.order);
          },
          error: (err: any) => {
            const msg = err.error?.detail ? JSON.stringify(err.error.detail) : JSON.stringify(err.error);
            alert('Failed to update marks/order: ' + msg);
          }
        });
      },
      error: (err: any) => {
        const msg = err.error ? JSON.stringify(err.error) : err.message;
        alert('Failed to update question content: ' + msg);
      }
    });
  }

  quickCreateQuestion(): void {
    if (!this.examId) return;

    const newQuestion = {
      title: 'New Question',
      question_text: 'Double-click to edit your question content...',
      question_type: 'MCQ',
      choices: [
        { text: 'Option A', is_correct: true },
        { text: 'Option B', is_correct: false }
      ]
    };

    this.http.post<QuestionDetails>(`${environment.apiUrl}/questions/`, newQuestion).subscribe({
      next: (createdQuestion: QuestionDetails) => {
        this.addQuestion(createdQuestion);
        alert('New question created and added to exam! Scroll down to edit details.');
      },
      error: (err: any) => alert('Failed to create new question')
    });
  }

  private calculateTotalMarks(): void {
    if (this.examQuestions) {
      this.totalMarks = this.examQuestions.reduce((sum: number, eq: any) => sum + (eq.marks || 0), 0);
    }
  }
}

interface Choice {
  text: string;
  is_correct: boolean;
}

interface QuestionDetails {
  id: string;
  title: string;
  question_text: string;
  question_type: 'MCQ' | 'TF' | 'DESCRIPTIVE';
  choices?: Choice[];
}
