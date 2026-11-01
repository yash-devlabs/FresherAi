import { apiRequest } from '@/services/apiClient';
export const startInterview = ({ data } = {}) => apiRequest('/interview/start', data);
export const submitAnswer = ({ data } = {}) => apiRequest('/interview/answer', data);
export const finishInterview = ({ data } = {}) => apiRequest('/interview/finish', data);
export const getInterviewHistory = () => apiRequest('/interview/history');
