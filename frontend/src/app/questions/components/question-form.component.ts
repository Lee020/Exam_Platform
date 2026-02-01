import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { QuestionService } from '../services/question.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-question-form',
  template: `
    <div class="container">
      <h2>{{ isEdit ? 'Edit' : 'Create' }} Question</h2>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label>Title</label>
          <input formControlName="title" />
        </div>
        <div>
          <label>Text</label>
          <textarea formControlName="question_text"></textarea>
        </div>
        <div>
          <label>Type</label>
          <select formControlName="question_type" (change)="onTypeChange()">
            <option value="MCQ">MCQ</option>
            <option value="TF">True/False</option>
          </select>
        </div>
        <div>
          <label>Difficulty</label>
          <select formControlName="difficulty">
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label>Subject</label>
          <select formControlName="subject">
            <option *ngFor="let s of subjects" [value]="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label>Topic</label>
          <select formControlName="topic">
            <option *ngFor="let t of topics" [value]="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div formArrayName="choices">
          <div *ngFor="let c of choices.controls; let i = index" [formGroupName]="i">
            <input formControlName="text" placeholder="Choice text" />
            <label><input type="checkbox" formControlName="is_correct" /> Correct</label>
            <button type="button" (click)="removeChoice(i)" *ngIf="canRemoveChoice()">Remove</button>
          </div>
          <button type="button" (click)="addChoice()" *ngIf="canAddChoice()">Add choice</button>
        </div>
        <div>
          <label>Status</label>
          <select formControlName="status">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Publish</option>
          </select>
        </div>
        <div>
          <button type="submit">{{ isEdit ? 'Save' : 'Create' }}</button>
        </div>
      </form>
      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
    </div>
  `
})
export class QuestionFormComponent implements OnInit {
  form: FormGroup;
  isEdit = false;
  subjects: any[] = [];
  topics: any[] = [];
  errorMessage = '';
  currentUser: any = null;

  constructor(private fb: FormBuilder, private svc: QuestionService, private route: ActivatedRoute, private router: Router, private auth: AuthService) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      question_text: ['', Validators.required],
      question_type: ['MCQ', Validators.required],
      difficulty: ['EASY', Validators.required],
      subject: ['', Validators.required],
      topic: ['', Validators.required],
      status: ['DRAFT', Validators.required],
      choices: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.loadSubjects();
    const id = this.route.snapshot.params['id'];
    this.isEdit = !!id;
    if (this.isEdit) this.loadQuestion(id);
    else this.ensureDefaultChoices();
  }

  get choices(): FormArray { return this.form.get('choices') as FormArray; }

  ensureDefaultChoices() {
    if (this.form.get('question_type')?.value === 'TF') {
      this.choices.clear();
      this.choices.push(this.fb.group({ text: ['True', Validators.required], is_correct: [false] }));
      this.choices.push(this.fb.group({ text: ['False', Validators.required], is_correct: [false] }));
    } else if (this.choices.length === 0) {
      this.addChoice();
      this.addChoice();
    }
  }

  onTypeChange() { this.ensureDefaultChoices(); }

  addChoice() { this.choices.push(this.fb.group({ text: ['', Validators.required], is_correct: [false] })); }
  removeChoice(i: number) { this.choices.removeAt(i); }
  canAddChoice() { return this.form.get('question_type')?.value === 'MCQ'; }
  canRemoveChoice() { return this.form.get('question_type')?.value === 'MCQ' && this.choices.length > 2; }

  loadSubjects() { this.svc.listSubjects().subscribe(res => this.subjects = res); this.svc.listTopics().subscribe(res => this.topics = res); }

  loadQuestion(id: string) {
    this.svc.retrieve(id).subscribe(q => {
      this.form.patchValue(q);
      this.choices.clear();
      (q.choices || []).forEach((c: any) => this.choices.push(this.fb.group({ text: [c.text], is_correct: [c.is_correct] })));
    });
  }

  submit() {
    this.errorMessage = '';
    const payload = this.form.value;
    if (this.isEdit) {
      const id = this.route.snapshot.params['id'];
      this.svc.update(id, payload).subscribe({ next: () => this.router.navigate(['/questions']), error: (e) => this.handleError(e) });
    } else {
      this.svc.create(payload).subscribe({ next: () => this.router.navigate(['/questions']), error: (e) => this.handleError(e) });
    }
  }

  handleError(e: any) {
    this.errorMessage = e?.message || 'Request failed';
    if (e?.errors) {
      // show first field error
      const keys = Object.keys(e.errors);
      if (keys.length) {
        this.errorMessage = e.errors[keys[0]][0] || this.errorMessage;
      }
    }
  }
}
