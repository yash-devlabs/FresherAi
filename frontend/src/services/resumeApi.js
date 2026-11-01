import { apiRequest } from '@/services/apiClient';
export const buildResume = ({ data } = {}) => apiRequest('/resume/build', data);
export const getResumeHistory = () => apiRequest('/resume/history');
export const deleteResume = ({ data } = {}) => apiRequest('/resume/delete', data);
