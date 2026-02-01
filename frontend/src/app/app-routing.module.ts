import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { DashboardComponent } from './core/components/dashboard/dashboard.component';

import { LoginComponent } from './auth/components/login.component';
import { RegisterComponent } from './auth/components/register.component';
import { QuestionListComponent } from './questions/components/question-list.component';
import { QuestionFormComponent } from './questions/components/question-form.component';
import { QuestionDetailComponent } from './questions/components/question-detail.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { path: 'questions', component: QuestionListComponent, canActivate: [AuthGuard] },
  { path: 'questions/new', component: QuestionFormComponent, canActivate: [AuthGuard] },
  { path: 'questions/:id', component: QuestionDetailComponent, canActivate: [AuthGuard] },
  { path: 'questions/:id/edit', component: QuestionFormComponent, canActivate: [AuthGuard] },
  {
    path: 'exams',
    loadChildren: () => import('./exams/exams.module').then(m => m.ExamsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'attempts',
    loadChildren: () => import('./attempts/attempts.module').then(m => m.AttemptsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
