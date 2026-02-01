import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: string;
    username: string;
    email: string;
    role_name: string;
    is_active: boolean;
    is_admin: boolean;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${environment.apiUrl}/users`;

    constructor(private http: HttpClient) { }

    getUsers(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/`);
    }

    updateUser(id: string, data: any): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/mgnt/${id}/`, data);
    }

    deleteUser(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/mgnt/${id}/`);
    }

    getRoles(): Observable<any[]> {
        // We can fetch roles if we had a role endpoint, or just hardcode for now
        // Return mock roles for the UI to use in the dropdown
        return new Observable(observer => {
            observer.next([
                { id: 'ADMIN', name: 'ADMIN' },
                { id: 'INSTRUCTOR', name: 'INSTRUCTOR' },
                { id: 'STUDENT', name: 'STUDENT' }
            ]);
            observer.complete();
        });
    }
}
