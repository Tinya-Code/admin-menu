import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Toast } from './components/shared/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, Toast],
  template: `
    <app-toast />
    @if (authService.ready$ | async) {
      <router-outlet />
    } @else {
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    }
  `,
})
export class App {
  protected authService = inject(AuthService);
}
