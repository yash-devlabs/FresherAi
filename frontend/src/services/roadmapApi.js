import { apiRequest } from '@/services/apiClient';
export const generateRoadmap = ({ data } = {}) => apiRequest('/roadmap/generate', data);
export const toggleRoadmapTopic = ({ data } = {}) => apiRequest('/roadmap/toggle', data);
export const getLatestRoadmap = () => apiRequest('/roadmap/latest');
