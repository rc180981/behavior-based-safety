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
        let msg = 'Gagal memuat daftar proyek';
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          const text = await res.text();
          msg = text || `HTTP ${res.status}`;
        }
        throw new Error(msg);
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
      let errorMsg = 'Gagal membuat proyek';
      try {
        const err = await res.json();
        errorMsg = err.error || errorMsg;
      } catch {
        const text = await res.text();
        errorMsg = text || `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const created = await res.json();
    await this.loadProjects();
    this.auth.setActiveProject(created, 'admin');
    return created;
  }
}
