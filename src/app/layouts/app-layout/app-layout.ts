import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBoxes,
  LucideDynamicIcon,
  LucideFolderTree,
  LucideHouse,
  LucidePackage,
  LucideSettings,
  LucideX,
} from '@lucide/angular';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: any;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, LucideDynamicIcon, LucideX],
  templateUrl: './app-layout.html',
})
export class AppLayout {
  private authService = inject(AuthService);
  protected user = this.authService.user$;
  protected sidebarOpen = signal(false);
  protected mobileMenuOpen = signal(false);

  protected navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LucideHouse },
    { label: 'Categorías', path: '/categories', icon: LucideFolderTree },
    { label: 'Productos', path: '/products', icon: LucidePackage },
    { label: 'Combos', path: '/combos', icon: LucideBoxes },
    { label: 'Configuración', path: '/settings', icon: LucideSettings },
  ];

  protected signOut(): void {
    this.authService.signOut().subscribe(() => {});
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
