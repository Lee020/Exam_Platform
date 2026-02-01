import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Attempt {
    id: string;
    exam: string;
    exam_title: string;
    start_time: string;
    finish_time?: string;
    status: 'STARTED' | 'COMPLETED' | 'TIMEOUT';
    score: number;
    questions?: any[]; // StudentQuestionSerializer format
    is_active: boolean;
    seconds_remaining?: number;
    violation_count?: number;
    is_offline_capable?: boolean;
    is_adaptive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AttemptService {
    private apiUrl = `${environment.apiUrl}/attempts`;

    constructor(private http: HttpClient) { }

    startAttempt(examId: string): Observable<Attempt> {
        return this.http.post<Attempt>(`${this.apiUrl}/start/${examId}/`, {});
    }

    getAttempt(id: string): Observable<Attempt> {
        return this.http.get<Attempt>(`${this.apiUrl}/${id}/`);
    }

    submitAnswer(attemptId: string, questionId: string, choiceId?: string, answerText?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${attemptId}/submit-answer/`, {
            question_id: questionId,
            selected_choice_id: choiceId,
            answer_text: answerText
        });
    }

    finishAttempt(attemptId: string): Observable<Attempt> {
        return this.http.post<Attempt>(`${this.apiUrl}/${attemptId}/finish/`, {});
    }

    getMyAttempts(): Observable<Attempt[]> {
        return this.http.get<Attempt[]>(this.apiUrl + '/');
    }

    // Alias for Instructors (semantics) - Backend permission handles the filtering
    getAllAttempts(): Observable<Attempt[]> {
        return this.http.get<Attempt[]>(this.apiUrl + '/');
    }

    recordViolation(attemptId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${attemptId}/record-violation/`, {});
    }

    getAttemptReview(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/review/`);
    }

    getCertificateDownloadUrl(attemptId: string): string {
        return `${this.apiUrl}/${attemptId}/certificate/`;
    }
}
