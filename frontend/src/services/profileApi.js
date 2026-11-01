import { apiRequest } from '@/services/apiClient';
export const getProfile = () => apiRequest('/profile/get');
export const updateProfile = ({ data = {} } = {}) => apiRequest('/profile/update', data);
