import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { TablerIconComponent } from '@tabler/icons-angular';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TablerIconComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  email    = '';
  password = '';
  showPw   = signal(false);
  error    = signal('');
  loading  = signal(false);

  async submit() {
    this.error.set('');
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = this.auth.login(this.email, this.password);
    this.loading.set(false);
    if (ok) {
      this.router.navigate(['/']);
    } else {
      this.error.set('Invalid username or password.');
    }
  }
}
