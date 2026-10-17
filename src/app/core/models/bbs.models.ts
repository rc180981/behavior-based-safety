export type ProjectRole = 'petugas' | 'supervisor' | 'admin';
export type RiskLevel = 'tinggi' | 'medium';
export type ItemCategory = 'wajib' | 'medium';
export type ObservationResult = 'positif' | 'improvement';
export type FindingStatus = 'open' | 'waiting_verification' | 'closed';
export type FindingRisk = 'rendah' | 'sedang' | 'tinggi';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  department?: string;
  loginType: 'sso' | 'lokal';
  active: boolean;
  superAdmin?: boolean;
}

export interface ProjectGeofence {
  lat: number;
  lng: number;
  radiusM: number;
  maxAccuracyM: number;
  required: boolean;
}

export interface ProjectDueDays {
  wajib: number; // default: 3
  medium: number; // default: 7
}

export interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  riskLevel: RiskLevel;
  geofence: ProjectGeofence;
  dueDays: ProjectDueDays;
}

export interface ProjectMember {
  uid: string;
  role: ProjectRole;
  active: boolean;
  name?: string;
  email?: string;
}

export interface ProjectArea {
  id: string;
  name: string;
  active: boolean;
}

export interface BBSItem {
  id: string;
  title: string;
  description: string;
  standardImagePath: string;
  version: number;
  active: boolean;
}

export interface ProjectItem {
  id: string;
  itemId: string;
  areaId: string;
  category: ItemCategory;
  standardVersion: number;
  active: boolean;
  categoryChangeReason?: string;
  // Denormalized for display
  title?: string;
  description?: string;
  standardImagePath?: string;
}

export interface ObservationLocation {
  lat: number;
  lng: number;
  accuracyM: number;
  distanceM: number;
}

export interface ObservationAnswer {
  projectItemId: string;
  itemId: string;
  category: ItemCategory;
  standardVersion: number;
  result: ObservationResult;
}

export interface Observation {
  id: string;
  projectId: string;
  areaId: string;
  observerUid: string;
  observerName?: string;
  submittedAt: string | Date;
  loc: ObservationLocation;
  answers: ObservationAnswer[];
}

export interface FindingHistoryEntry {
  actorUid: string;
  action: 'created' | 'followed_up' | 'verified' | 'rejected';
  status: FindingStatus;
  note?: string;
  at: string;
}

export interface Finding {
  id: string;
  observationId: string;
  projectId: string;
  areaId: string;
  projectItemId: string;
  category: ItemCategory;
  risk: FindingRisk;
  note: string;
  photosBefore: string[];
  photosAfter: string[];
  picUid: string;
  picName?: string;
  dueDate: string; // YYYY-MM-DD
  status: FindingStatus;
  history: FindingHistoryEntry[];
  // Calculated dynamically
  isOverdue?: boolean;
  remainingDays?: number;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  action: string;
  targetPath: string;
  before: unknown;
  after: unknown;
  at: string;
}
