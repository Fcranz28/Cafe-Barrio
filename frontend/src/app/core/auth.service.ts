import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  readonly username = signal<string | null>(null);
  check() {
    return this.http.get<{ username: string }>('/api/auth/me').pipe(
      tap((u) => this.username.set(u.username)),
      map(() => true),
      catchError(() => {
        this.username.set(null);
        return of(false);
      }),
    );
  }
  login(username: string, password: string) {
    return this.api.csrf().pipe(
      switchMap(() =>
        this.http.post(
          '/api/auth/login',
          new HttpParams().set('username', username).set('password', password),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        ),
      ),
      switchMap(() => this.api.csrf()),
      switchMap(() => this.check()),
    );
  }
  logout() {
    return this.http.post('/api/auth/logout', {}).pipe(
      tap(() => this.username.set(null)),
      switchMap(() => this.api.csrf()),
    );
  }
}
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService)
    .check()
    .pipe(map((ok) => ok || router.createUrlTree(['/admin/login'])));
};
