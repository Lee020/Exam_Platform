import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuestionListComponent } from './components/question-list.component';
import { QuestionFormComponent } from './components/question-form.component';
import { QuestionDetailComponent } from './components/question-detail.component';

@NgModule({
  declarations: [
    QuestionListComponent,
    QuestionFormComponent,
    QuestionDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    QuestionListComponent,
    QuestionFormComponent,
    QuestionDetailComponent
  ]
})
export class QuestionsModule { }
