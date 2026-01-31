import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      const requiredRole = route.data['role'];
      
      if (requiredRole) {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.role_name === requiredRole) {
          return true;
        }
        // User doesn't have required role
        this.router.navigate(['/dashboard']);
        return false;
      }
      
      return true;
    }

    // Not logged in, redirect to login
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
