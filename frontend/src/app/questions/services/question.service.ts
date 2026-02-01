import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private base = `${environment.apiUrl}/questions`;
  private subjectsBase = `${environment.apiUrl}/subjects`;
  private topicsBase = `${environment.apiUrl}/topics`;

  constructor(private http: HttpClient) {}

  list(params: any = {}) {
    let p = new HttpParams();
    Object.keys(params || {}).forEach(k => { if (params[k] !== undefined && params[k] !== '') p = p.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/`, { params: p });
  }

  retrieve(id: string) { return this.http.get<any>(`${this.base}/${id}/`); }
  create(payload: any) { return this.http.post<any>(`${this.base}/`, payload); }
  update(id: string, payload: any) { return this.http.put<any>(`${this.base}/${id}/`, payload); }
  partial(id: string, payload: any) { return this.http.patch<any>(`${this.base}/${id}/`, payload); }
  delete(id: string) { return this.http.delete<any>(`${this.base}/${id}/`); }

  listSubjects() { return this.http.get<any>(`${this.subjectsBase}/`); }
  listTopics() { return this.http.get<any>(`${this.topicsBase}/`); }
}
