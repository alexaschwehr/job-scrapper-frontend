import axios from 'axios';

// Configure your backend API base URL here
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://54.144.177.173:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const jobsAPI = {
  getAllJobs: async (params = {}) => {
    const {
      page = 1,
      page_size = 20,
      platform = '',
      search_term = '',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('page_size', page_size);
    if (platform) queryParams.append('platform', platform);
    if (search_term) queryParams.append('search_term', search_term);

    const response = await api.get(`/jobs/all?${queryParams.toString()}`);
    return response.data;
  },

  triggerManualFetch: async (params = {}) => {
    const {
      platforms = ['linkedin', 'indeed', 'glassdoor', 'zip_recruiter', 'monster'],
      search_term = 'software engineer',
      location = 'United States',
      limit = 20,
    } = params;

    try {
      const response = await api.post('/lambda/trigger', {
        platforms,
        search_term,
        location,
        limit,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;

