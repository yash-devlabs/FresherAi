import { apiRequest } from '@/services/apiClient';
export const generateFeedback = ({ data } = {}) => apiRequest('/feedback/generate', data);
export const getLatestFeedback = () => apiRequest('/feedback/latest');
export const NO_COMMUNICATION_EVIDENCE = 'Communication score will be available after your first completed mock interview.';
