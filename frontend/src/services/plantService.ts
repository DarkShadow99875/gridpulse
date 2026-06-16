import axiosInstance from './axiosInstance';
import { EnergyPlant, Metric, PlantFilters } from '../types';

function buildParams(filters: PlantFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.company) params.append('company', filters.company);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export type PlantPayload = Omit<EnergyPlant, 'id' | 'lastUpdated'>;

export type MetricPayload = Omit<Metric, 'id' | 'plantId'>;

export const plantService = {
  async list(filters: PlantFilters = {}): Promise<EnergyPlant[]> {
    const { data } = await axiosInstance.get<EnergyPlant[]>(`/api/plants${buildParams(filters)}`);
    return data;
  },

  async getById(id: number): Promise<EnergyPlant> {
    const { data } = await axiosInstance.get<EnergyPlant>(`/api/plants/${id}`);
    return data;
  },

  async create(payload: PlantPayload): Promise<EnergyPlant> {
    const { data } = await axiosInstance.post<EnergyPlant>('/api/plants', payload);
    return data;
  },

  async update(id: number, payload: Partial<PlantPayload>): Promise<EnergyPlant> {
    const { data } = await axiosInstance.put<EnergyPlant>(`/api/plants/${id}`, payload);
    return data;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/plants/${id}`);
  },

  async listMetrics(plantId: number, start?: string, end?: string, limit?: number): Promise<Metric[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (limit) params.append('limit', String(limit));
    const qs = params.toString();
    const { data } = await axiosInstance.get<Metric[]>(`/api/plants/${plantId}/metrics${qs ? `?${qs}` : ''}`);
    return data;
  },

  async createMetric(plantId: number, payload: MetricPayload): Promise<Metric> {
    const { data } = await axiosInstance.post<Metric>(`/api/plants/${plantId}/metrics`, payload);
    return data;
  },

  async updateMetric(id: number, payload: Partial<MetricPayload>): Promise<Metric> {
    const { data } = await axiosInstance.put<Metric>(`/api/metrics/${id}`, payload);
    return data;
  },

  async deleteMetric(id: number): Promise<void> {
    await axiosInstance.delete(`/api/metrics/${id}`);
  },
};