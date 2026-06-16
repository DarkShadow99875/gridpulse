export interface User {
  id: number;
  email: string;
  fullName: string;
  enabled: boolean;
  mfaEnabled: boolean;
  preferredMfaMethod: string;
  roles: string[];
  createdAt: string;
  hasPendingInvitation: boolean;
  invitationToken?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export interface EnergyPlant {
  id: number;
  name: string;
  type: string;
  location: string;
  capacityMw: number;
  company: string;
  status: string;
  latitude?: number;
  longitude?: number;
  lastUpdated?: string;
}

export interface Metric {
  id: number;
  plantId: number;
  recordedAt: string;
  powerOutput: number;
  efficiency: number;
  temperature: number;
  irradiance?: number;
  co2Avoided?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
}

export interface PlantFilters {
  search?: string;
  type?: string;
  status?: string;
  company?: string;
}

export type UserStatus = 'active' | 'disabled' | 'pending' | '';