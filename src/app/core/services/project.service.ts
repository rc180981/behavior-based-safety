import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Project, ProjectArea, ProjectItem } from '../models/bbs.models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private auth = inject(AuthService);

  readonly projects = signal<Project[]>([]);
  readonly activeAreas = signal<ProjectArea[]>([]);
  readonly activeItems = signal<ProjectItem[]>([]);
  readonly isLoading = signal<boolean>(false);

  async loadProjects(): Promise<Project[]> {
    this.isLoading.set(true);
    try {
      const token = await this.auth.getIdToken();
      const res = await fetch('/api/admin/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal memuat daftar proyek');
      }

      const data = await res.json();
      const list = data.projects || [];
      this.projects.set(list);

      // Auto-select first project if none is active
      if (list.length > 0 && !this.auth.activeProject()) {
        const first = list[0];
        this.auth.setActiveProject(first, first.userRole || 'admin');
        await this.loadProjectDetails(first.id);
      }

      return list;
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadProjectDetails(projectId: string): Promise<void> {
    const token = await this.auth.getIdToken();
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Load Areas
      const areasRes = await fetch(`/api/admin/areas?projectId=${projectId}`, { headers });
      if (areasRes.ok) {
        const data = await areasRes.json();
        this.activeAreas.set(data.areas || []);
      }

      // 2. Load Project Items
      const itemsRes = await fetch(`/api/admin/project-items?projectId=${projectId}`, { headers });
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        this.activeItems.set(data.projectItems || []);
      }
    } catch (err) {
      console.warn('Error loading project details:', err);
    }
  }

  async createInitialProject(name: string, code: string): Promise<Project> {
    const token = await this.auth.getIdToken();
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        code,
        riskLevel: 'tinggi',
        geofence: {
          lat: -6.2088,
          lng: 106.8456,
          radiusM: 200,
          maxAccuracyM: 50,
          required: false, // Default false for initial dev testing so user can test anywhere
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat proyek');
    }

    const created = await res.json();
    await this.loadProjects();
    return created;
  }
}
