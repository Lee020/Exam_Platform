import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  status: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  /**
   * Register a new user
   */
  register(username: string, email: string, password: string, password_confirm: string, role: string = 'STUDENT'): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, {
      username,
      email,
      password,
      password_confirm,
      role
    }).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (response.access_token && response.user) {
          this.storeTokens(response.access_token, response.refresh_token);
          this.currentUserSubject.next(response.user);
          this.isLoggedInSubject.next(true);
        }
      }),
      map(response => response.user),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<any> {
    const token = this.getAccessToken();

    const logout$ = token
      ? this.http.post(`${this.apiUrl}/logout/`, { access_token: token })
      : new Observable(observer => observer.next({}));

    return logout$.pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
      }),
      catchError(error => {
        // Clear tokens even if logout fails
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(): Observable<{ access_token: string; expires_in: number }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(`${this.apiUrl}/refresh/`, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        if (response.access_token) {
          this.storeAccessToken(response.access_token);
        }
      }),
      catchError(error => {
        // If refresh fails, logout user
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verify token is still valid
   */
  verifyToken(): Observable<User> {
    return this.http.get<{ status: string; user: User }>(`${this.apiUrl}/verify/`).pipe(
      map(response => response.user),
      tap(user => {
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      }),
      catchError(error => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isLoggedInSubject.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Private helper methods
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private storeAccessToken(accessToken: string): void {
    localStorage.setItem('access_token', accessToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private restoreSession(): void {
    if (this.isLoggedIn()) {
      this.verifyToken().subscribe({
        next: () => { },
        error: (err) => {
          // Only logout if it's an auth error (401/403), maintain session on network error
          if (err.status === 401 || err.status === 403) {
            this.clearTokens();
          }
        }
      });
    }
  }

  private handleError(error: any): Observable<never> {
    let message = 'An error occurred';
    let errors: any = null;

    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else if (error.status) {
      // DRF usually returns either { detail: '...' } or a dict of field errors
      if (error.error) {
        if (typeof error.error === 'string') {
          message = error.error;
        } else {
          // Check if 'errors' property exists in the response body (Standard format)
          if (error.error.errors) {
            errors = error.error.errors;
          } else {
            errors = error.error;
          }

          message = error.error.detail || error.error.message || '';

          // If no top-level message, try to pick the first field error from extracted errors
          if (!message && errors) {
            for (const k of Object.keys(errors)) {
              const val = errors[k];
              if (Array.isArray(val) && val.length > 0) {
                message = val[0];
                break;
              } else if (typeof val === 'string') {
                message = val;
                break;
              }
            }
          }

          if (!message) {
            message = error.statusText || 'Request failed';
          }
        }
      } else {
        message = error.statusText || `HTTP ${error.status}`;
      }
    }

    // Throw a structured error object so components can display field errors
    return throwError(() => ({ message, errors, status: error.status }));
  }
}
