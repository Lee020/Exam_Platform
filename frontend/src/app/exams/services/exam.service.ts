import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Exam {
    id?: string;
    title: string;
    description: string;
    duration_minutes: number;
    pass_marks: number;
    start_time?: string;
    end_time?: string;
    status: 'DRAFT' | 'PUBLISHED';
    created_at?: string;
    updated_at?: string;
    exam_questions?: any[];
    total_marks?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ExamService {
    private apiUrl = `${environment.apiUrl}/exams`;

    constructor(private http: HttpClient) { }

    getExams(): Observable<any> {
        return this.http.get(this.apiUrl + '/');
    }

    getExam(id: string): Observable<Exam> {
        return this.http.get<Exam>(`${this.apiUrl}/${id}/`);
    }

    createExam(exam: Exam): Observable<Exam> {
        return this.http.post<Exam>(this.apiUrl + '/', exam);
    }

    updateExam(id: string, exam: Exam): Observable<Exam> {
        return this.http.put<Exam>(`${this.apiUrl}/${id}/`, exam);
    }

    deleteExam(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}/`);
    }

    addQuestionToExam(examId: string, data: { question_id: string, marks: number, order: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${examId}/add-question/`, data);
    }

    removeQuestionFromExam(examId: string, questionId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${examId}/remove-question/`, { question_id: questionId });
    }

    updateExamQuestion(id: string, data: { marks?: number, order?: number }): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/exam-questions/${id}/`, data);
    }

    getExamAnalytics(examId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${examId}/analytics/`);
    }

    getExamMonitoring(examId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${examId}/monitoring/`);
    }

    updateQuestion(questionId: string, data: any): Observable<any> {
        return this.http.patch(`${environment.apiUrl}/questions/${questionId}/`, data);
    }
}
