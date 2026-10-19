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
          const raw = await res.text();
          try {
            const err = JSON.parse(raw);
            msg = err.error || msg;
          } catch {
            msg = raw || `HTTP ${res.status}`;
          }
        } catch {
          msg = `HTTP ${res.status}`;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      const list = data.projects || [];
      this.projects.set(list);

      // Auto-select project with role resolution
      if (list.length > 0) {
        const savedId = localStorage.getItem('bbs_active_project');
        const found = savedId ? list.find((p: Project) => p.id === savedId) : null;
        const target = found || list[0]!;
        
        // If no active project or active project changed, set it
        if (!this.auth.activeProject() || this.auth.activeProject()?.id !== target.id) {
          const role = target.userRole || (this.auth.isSuperAdmin() ? 'admin' : 'petugas');
          this.auth.setActiveProject(target, role);
          await this.loadProjectDetails(target.id);
        }
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

  async createInitialProject(name: string, code: string, riskLevel: 'tinggi' | 'medium' = 'tinggi'): Promise<Project> {
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
        riskLevel,
        geofence: {
          lat: -6.2088,
          lng: 106.8456,
          radiusM: 200,
          maxAccuracyM: 50,
          required: false, // Default false for initial dev testing so user can test anywhere
        },
      }),
    });

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(raw);
    } catch {
      // Non-JSON response
    }

    if (!res.ok) {
      const errorMsg = (data['error'] as string) || raw || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMsg);
    }

    const created = data as unknown as Project;
    await this.loadProjects();
    this.auth.setActiveProject(created, 'admin');
    return created;
  }
}
