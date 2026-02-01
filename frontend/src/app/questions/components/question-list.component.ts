import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-question-list',
  template: `
    <div class="container">
      <h2>Questions</h2>

      <div class="toolbar">
        <input placeholder="Search title" [(ngModel)]="q" (input)="load()" />
        <select [(ngModel)]="filterSubject" (change)="load()">
          <option value="">All subjects</option>
          <option *ngFor="let s of subjects" [value]="s.id">{{ s.name }}</option>
        </select>
        <select [(ngModel)]="filterDifficulty" (change)="load()">
          <option value="">All difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <button *ngIf="canEdit" (click)="create()">New Question</button>
      </div>

      <div *ngFor="let item of questions" class="question-card">
        <h3>{{ item.title }} <span class="badge">{{ item.status }}</span></h3>
        <p>{{ item.question_text }}</p>
        <small>By: {{ item.created_by?.username }} — {{ item.created_at | date:'short' }}</small>
        <div class="actions">
          <button (click)="view(item.id)">View</button>
          <button *ngIf="canEdit && (isAdmin || item.created_by?.username===currentUser?.username)" (click)="edit(item.id)">Edit</button>
        </div>
      </div>
    </div>
  `
})
export class QuestionListComponent implements OnInit {
  questions: any[] = [];
  subjects: any[] = [];
  q = '';
  filterSubject = '';
  filterDifficulty = '';
  currentUser: any = null;
  isAdmin = false;

  constructor(private svc: QuestionService, private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.isAdmin = this.currentUser?.role_name === 'ADMIN';
    this.loadSubjects();
    this.load();
  }

  get canEdit() {
    return this.isAdmin;
  }

  loadSubjects() {
    this.svc.listSubjects().subscribe(res => this.subjects = res);
  }

  load() {
    const params: any = {};
    if (this.q) params.search = this.q;
    if (this.filterSubject) params.subject = this.filterSubject;
    if (this.filterDifficulty) params.difficulty = this.filterDifficulty;
    this.svc.list(params).subscribe(res => this.questions = res.results || res);
  }

  create() { this.router.navigate(['/questions/new']); }
  view(id: string) { this.router.navigate(['/questions', id]); }
  edit(id: string) { this.router.navigate(['/questions', id, 'edit']); }
}
