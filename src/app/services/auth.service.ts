import { Injectable, inject } from '@angular/core';
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
import { BehaviorSubject, Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/user-profile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private auth: Auth;
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  private readySubject = new BehaviorSubject<boolean>(false);

  user$: Observable<UserProfile | null> = this.userSubject.asObservable();
  ready$: Observable<boolean> = this.readySubject.asObservable();

  constructor() {
    const app = initializeApp(environment.firebase);
    this.auth = getAuth(app);

    onAuthStateChanged(this.auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        this.userSubject.next(this.mapUser(firebaseUser));
      } else {
        this.userSubject.next(null);
      }
      this.readySubject.next(true);
    });
  }

  get currentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.userSubject.value !== null;
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

  private mapUser(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }
}
