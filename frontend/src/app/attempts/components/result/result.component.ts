import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AttemptService, Attempt } from '../../services/attempt.service';

@Component({
    selector: 'app-result',
    template: `
    <div class="container mt-5 text-center" *ngIf="attempt">
      <div class="card shadow">
        <div class="card-body py-5">
          <h1 class="display-4 mb-4">Exam Completed</h1>
          <h2 class="text-primary">{{ attempt.exam_title }}</h2>
          
          <div class="my-5">
            <div class="display-1 fw-bold" [class.text-success]="attempt.score >= 0">
              {{ attempt.score }}
            </div>
            <p class="text-muted">Your Score</p>
          </div>
          
          <div class="alert alert-info d-inline-block">
            Status: <strong>{{ attempt.status }}</strong>
          </div>
          
          <div class="mt-5">
            <a routerLink="/dashboard" class="btn btn-primary btn-lg">Return to Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ResultComponent implements OnInit {
    attempt: Attempt | null = null;

    constructor(
        private route: ActivatedRoute,
        private attemptService: AttemptService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.attemptService.getAttempt(id).subscribe(att => {
                this.attempt = att;
            });
        }
    }
}
