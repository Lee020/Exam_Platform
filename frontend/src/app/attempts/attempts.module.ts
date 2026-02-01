import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { TakeExamComponent } from './components/take-exam/take-exam.component';
import { ResultComponent } from './components/result/result.component';
import { AttemptReviewComponent } from './components/attempt-review/attempt-review.component';
import { AuthGuard } from '../auth/guards/auth.guard';

import { AttemptHistoryComponent } from './components/attempt-history/attempt-history.component';

const routes: Routes = [
    { path: '', component: AttemptHistoryComponent, canActivate: [AuthGuard] },
    { path: 'exam/:examId/start', component: TakeExamComponent, canActivate: [AuthGuard] },
    { path: 'take/:attemptId', component: TakeExamComponent, canActivate: [AuthGuard] },
    { path: 'result/:id', component: ResultComponent, canActivate: [AuthGuard] },
    { path: ':id/result', component: ResultComponent, canActivate: [AuthGuard] },
    { path: ':id/review', component: AttemptReviewComponent, canActivate: [AuthGuard] }
];

@NgModule({
    declarations: [
        TakeExamComponent,
        ResultComponent,
        AttemptHistoryComponent,
        AttemptReviewComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes)
    ]
})
export class AttemptsModule { }
