import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { UserProfile, Project, ProjectRole } from '../models/bbs.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fb = inject(FirebaseService);

  readonly currentUser = signal<FirebaseUser | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly activeProject = signal<Project | null>(null);
  readonly currentRole = signal<ProjectRole | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isSuperAdmin = computed(() => this.userProfile()?.superAdmin === true);

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener(): void {
    onAuthStateChanged(this.fb.auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile.set(null);
        this.activeProject.set(null);
        this.currentRole.set(null);
      }
      this.isLoading.set(false);
    });
  }

  async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(this.fb.db, 'users', uid));
      if (userDoc.exists()) {
        this.userProfile.set({ uid, ...(userDoc.data() as Omit<UserProfile, 'uid'>) });
      } else {
        // Fallback profile if Firestore user doc not yet synced
        this.userProfile.set({
          uid,
          name: this.currentUser()?.displayName || 'Petugas HSE',
          email: this.currentUser()?.email || '',
          loginType: 'sso',
          active: true,
          superAdmin: false,
        });
      }
    } catch (err) {
      console.warn('Could not load user profile from Firestore:', err);
    }
  }

  async loginWithEmail(email: string, pass: string): Promise<void> {
    this.isLoading.set(true);
    try {
      await signInWithEmailAndPassword(this.fb.auth, email, pass);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.fb.auth, provider);
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.fb.auth);
    this.currentUser.set(null);
    this.userProfile.set(null);
    this.activeProject.set(null);
    this.currentRole.set(null);
  }

  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    if (!user) return null;
    return await user.getIdToken();
  }

  setActiveProject(project: Project, role: ProjectRole): void {
    this.activeProject.set(project);
    this.currentRole.set(role);
  }
}
