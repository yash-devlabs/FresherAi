import { apiRequest } from '@/services/apiClient';
export const getDashboardData = () => apiRequest('/dashboard');
