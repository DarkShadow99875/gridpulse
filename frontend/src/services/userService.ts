import axiosInstance from './axiosInstance';
import { User, UserFilters, Role } from '../types';

export interface CreateUserPayload {
  email: string;
  fullName: string;
  roles: string[];
}

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  roles?: string[];
}

function buildParams(filters: UserFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.role) params.append('role', filters.role);
  if (filters.status) params.append('status', filters.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const userService = {
  async list(filters: UserFilters = {}): Promise<User[]> {
    const { data } = await axiosInstance.get<User[]>(`/api/users${buildParams(filters)}`);
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await axiosInstance.get<User>(`/api/users/${id}`);
    return data;
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await axiosInstance.post<User>('/api/users', payload);
    return data;
  },

  async update(id: number, payload: UpdateUserPayload): Promise<User> {
    const { data } = await axiosInstance.patch<User>(`/api/users/${id}`, payload);
    return data;
  },

  async disable(id: number): Promise<void> {
    await axiosInstance.patch(`/api/users/${id}/disable`);
  },

  async enable(id: number): Promise<void> {
    await axiosInstance.patch(`/api/users/${id}/enable`);
  },

  async resendInvitation(id: number): Promise<User> {
    const { data } = await axiosInstance.post<User>(`/api/users/${id}/resend-invitation`);
    return data;
  },

  async revokeInvitation(id: number): Promise<void> {
    await axiosInstance.delete(`/api/users/${id}/invitation`);
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/users/${id}`);
  },

  async resetMfa(id: number): Promise<void> {
    await axiosInstance.post(`/api/users/${id}/reset-mfa`);
  },

  async listRoles(): Promise<Role[]> {
    const { data } = await axiosInstance.get<Role[]>('/api/roles');
    return data;
  },

  buildInvitationLink(token: string): string {
    return `${window.location.origin}/register?token=${token}`;
  },
};