import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { UserProfile, Project, ProjectRole } from '../models/bbs.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fb = inject(FirebaseService);
  private router = inject(Router);

  readonly currentUser = signal<FirebaseUser | null>(null);
  readonly userProfile = signal<UserProfile | null>(null);
  readonly activeProject = signal<Project | null>(null);
  readonly currentRole = signal<ProjectRole | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly isAuthenticated = computed(() => !!this.currentUser());
  
  // SuperAdmin: either marked in userProfile or primary owner email
  readonly isSuperAdmin = computed(() => {
    const email = this.currentUser()?.email;
    return this.userProfile()?.superAdmin === true || email === 'rc180981@gmail.com';
  });

  // Role permissions
  readonly isAdmin = computed(() => this.currentRole() === 'admin' || this.isSuperAdmin());
  readonly isSupervisor = computed(() => this.currentRole() === 'supervisor' || this.isAdmin());
  readonly isPetugas = computed(() => this.currentRole() === 'petugas' || this.isSupervisor());

  // Capability checks
  readonly canAccessAdmin = computed(() => this.isAdmin());
  readonly canVerifyFindings = computed(() => this.isSupervisor());
  readonly canAccessCrossProject = computed(() => this.isSuperAdmin());

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
    const email = this.currentUser()?.email || '';
    const isOwner = email === 'rc180981@gmail.com';

    try {
      const userRef = doc(this.fb.db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        const superAdmin = data['superAdmin'] === true || isOwner;
        this.userProfile.set({
          uid,
          name: data['name'] || this.currentUser()?.displayName || 'Pengguna BBS',
          email: data['email'] || email,
          department: data['department'] || 'HSE Operations',
          loginType: data['loginType'] || 'sso',
          active: data['active'] !== false,
          superAdmin,
        });

        // If superAdmin status needs update in doc for owner
        if (isOwner && data['superAdmin'] !== true) {
          await setDoc(userRef, { superAdmin: true }, { merge: true });
        }
      } else {
        // Create initial profile in Firestore
        const newProfile: UserProfile = {
          uid,
          name: this.currentUser()?.displayName || email.split('@')[0] || 'Petugas HSE',
          email,
          department: isOwner ? 'HSE Corporate' : 'HSE Field',
          loginType: 'sso',
          active: true,
          superAdmin: isOwner,
        };

        try {
          await setDoc(userRef, {
            ...newProfile,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        } catch {
          // If Firestore rules prevent client-side write, use in-memory profile
        }

        this.userProfile.set(newProfile);
      }
    } catch (err) {
      console.warn('Could not load user profile from Firestore:', err);
      // Fallback in-memory profile
      this.userProfile.set({
        uid,
        name: this.currentUser()?.displayName || email.split('@')[0] || 'Pengguna BBS',
        email,
        loginType: 'sso',
        active: true,
        superAdmin: isOwner,
      });
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
    try {
      await signOut(this.fb.auth);
    } catch (err) {
      console.warn('SignOut warning:', err);
    } finally {
      this.currentUser.set(null);
      this.userProfile.set(null);
      this.activeProject.set(null);
      this.currentRole.set(null);
      localStorage.removeItem('bbs_active_project');
      await this.router.navigate(['/login']);
    }
  }

  async getIdToken(): Promise<string | null> {
    const user = this.currentUser();
    if (!user) return null;
    return await user.getIdToken();
  }

  setActiveProject(project: Project, role: ProjectRole): void {
    this.activeProject.set(project);
    this.currentRole.set(role);
    localStorage.setItem('bbs_active_project', project.id);
  }
}
