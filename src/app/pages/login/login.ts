import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../components/shared/button';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/user-not-found': 'No encontramos una cuenta con este email',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/invalid-email': 'El formato del email no es válido',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/popup-closed-by-user': 'Se canceló el inicio de sesión',
  'auth/popup-blocked': 'Permite ventanas emergentes para usar Google',
};

function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || '';
  return FIREBASE_ERRORS[code] || 'Error de conexión. Verifica tu internet';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, Button],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected showPassword = signal(false);
  protected loading = signal(false);
  protected error = signal('');

  protected signIn(): void {
    if (!this.email || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.signInWithEmail(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(getFirebaseErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected signInWithGoogle(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.signInWithGoogle().subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(getFirebaseErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
