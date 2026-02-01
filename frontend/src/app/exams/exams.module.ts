import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { ExamListComponent } from './components/exam-list/exam-list.component';
import { ExamFormComponent } from './components/exam-form/exam-form.component';
import { ExamBuilderComponent } from './components/exam-builder/exam-builder.component';
import { ExamAnalyticsComponent } from './components/exam-analytics/exam-analytics.component';
import { ExamMonitoringComponent } from './components/exam-monitoring/exam-monitoring.component';
import { AuthGuard } from '../auth/guards/auth.guard';

const routes: Routes = [
    { path: '', component: ExamListComponent, canActivate: [AuthGuard] },
    { path: 'new', component: ExamFormComponent, canActivate: [AuthGuard] },
    { path: ':id/edit', component: ExamFormComponent, canActivate: [AuthGuard] },
    { path: ':id/builder', component: ExamBuilderComponent, canActivate: [AuthGuard] },
    { path: ':id/analytics', component: ExamAnalyticsComponent, canActivate: [AuthGuard] },
    { path: ':id/monitoring', component: ExamMonitoringComponent, canActivate: [AuthGuard] }
];

@NgModule({
    declarations: [
        ExamListComponent,
        ExamFormComponent,
        ExamBuilderComponent,
        ExamAnalyticsComponent,
        ExamMonitoringComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule.forChild(routes)
    ]
})
export class ExamsModule { }
