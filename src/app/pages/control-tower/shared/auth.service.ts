import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _authenticated = signal(
    sessionStorage.getItem('me_auth') === 'true',
  );

  readonly isAuthenticated = this._authenticated.asReadonly();

  constructor(private router: Router) {}

  private readonly credentials = [
    { id: 'test', password: 'test123' },
    { id: 'adb',  password: 'digikm-team' },
  ];

  login(email: string, password: string): boolean {
    const valid = this.credentials.some(c => c.id === email.trim() && c.password === password);
    if (valid) {
      sessionStorage.setItem('me_auth', 'true');
      this._authenticated.set(true);
    }
    return valid;
  }

  logout(): void {
    sessionStorage.removeItem('me_auth');
    this._authenticated.set(false);
    this.router.navigate(['/control-tower/login']);
  }
}
