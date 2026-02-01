import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService } from '../services/question.service';

@Component({
  selector: 'app-question-detail',
  template: `
    <div class="container" *ngIf="q">
      <h2>{{ q.title }} <span class="badge">{{ q.status }}</span></h2>
      <p>{{ q.question_text }}</p>
      <ul>
        <li *ngFor="let c of q.choices">{{ c.text }} <strong *ngIf="c.is_correct">(Correct)</strong></li>
      </ul>
      <button (click)="back()">Back</button>
    </div>
  `
})
export class QuestionDetailComponent implements OnInit {
  q: any = null;
  constructor(private route: ActivatedRoute, private svc: QuestionService, private router: Router) {}
  ngOnInit(): void { const id = this.route.snapshot.params['id']; this.svc.retrieve(id).subscribe(res => this.q = res); }
  back() { this.router.navigate(['/questions']); }
}
