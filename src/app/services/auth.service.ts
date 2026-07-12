import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  UserCredential,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { BehaviorSubject, Observable, from, switchMap, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user-profile';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      restaurantId: string;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth: Auth;
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  private readySubject = new BehaviorSubject<boolean>(false);

  user$: Observable<UserProfile | null> = this.userSubject.asObservable();
  ready$: Observable<boolean> = this.readySubject.asObservable();

  constructor() {
    const app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        this.loginWithBackend().subscribe({
          error: () => {
            this.userSubject.next(null);
            this.readySubject.next(true);
          },
        });
      } else {
        this.userSubject.next(null);
        this.readySubject.next(true);
      }
    });
  }

  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  get restaurantId(): string | null {
    return this.userSubject.value?.restaurant_id ?? null;
  }

  signInWithEmail(email: string, password: string): Observable<UserCredential> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  signInWithGoogle(): Observable<UserCredential> {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider));
  }

  signOut(): Observable<void> {
    return from(firebaseSignOut(this.auth));
  }

  getIdToken(): Promise<string> {
    if (!this.auth.currentUser) return Promise.resolve('');
    return this.auth.currentUser.getIdToken();
  }

  loginWithBackend(): Observable<UserProfile> {
    return from(this.getIdToken()).pipe(
      switchMap((idToken) =>
        this.http.post<LoginResponse>(`${environment.apiURL}/auth/login`, { idToken })
      ),
      map((res) => {
        const user = res.data.user;
        return {
          uid: user.id,
          email: user.email,
          restaurant_id: user.restaurantId,
          displayName: user.name,
          photoURL: null,
        };
      }),
      tap((profile) => {
        this.userSubject.next(profile);
        this.readySubject.next(true);
      })
    );
  }
}
