import { apiRequest } from '@/services/apiClient';
export async function analyzeResume(_previousState, formData) {
  try {
    const result = await apiRequest('/resume/analyze', {
      content: String(formData.get('content') ?? ''),
      targetRole: String(formData.get('targetRole') ?? ''),
      jobDescription: String(formData.get('jobDescription') ?? ''),
    });
    return result;
  } catch (error) {
    return { status: 'error', message: error.message || 'Could not analyze your resume. Please try again.' };
  }
}
