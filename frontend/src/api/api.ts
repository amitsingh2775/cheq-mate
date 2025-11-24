
import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const BASE_URL = 'https://cheq-mate-i9gj.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export interface User {
  uid: string;
  email: string;
  profilePhotoUrl?: string;
  createdAt?: string;
}


export interface Echo {
  _id: string;
  creator?: {
    uid?: string;
    username?: string;
    profilePhotoUrl?: string | null;
  } | null;
  audioUrl: string;
  caption?: string;
  status: 'pending' | 'live';
  isPublic: boolean;
  goLiveAt: string;
  createdAt: string;
}

export interface FeedResponse {
  page: number;
  limit: number;
  results: Echo[];
}

export const authApi = {
  signup: (data: { email: string; password: string }) =>
    api.post('/api/v1/users/signup', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post<{ token: string; user: User }>('/api/v1/users/verify-otp', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/api/v1/users/login', data),

  getProfile: () =>
    api.get<User>('/api/v1/users/profile'),


  resendOtp:(data: { email: string })=>
      api.post<{email: string}>('/api/v1/users/resend-otp',data),

  requestResetPassword:(data:{email:string})=>
            api.post<{email:string}>('/api/v1/users/request-reset-pass',data),

  verifyresetPassOtp:(data:{email:string,otp:string})=>
           api.post<{message:string,verified:boolean}>('/api/v1/users/verify-reset-otp',data),

  resetPassword:(data:{email:string,newPassword:string,confirmPassword:string})=>
           api.post<{message:string,verified:boolean}>('/api/v1/users/reset-password',data)
};

export const echoApi = {
  createEcho: (formData: FormData) =>
    api.post<Echo>('/api/v1/echos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getMyEchos: (page = 1, limit = 50) =>
    api.get<{ results: Echo[]; page?: number; limit?: number }>(
      '/api/v1/echos/my-echos',
      { params: { page, limit } }
    ),

  getFeed: (page = 1, limit = 20): Promise<AxiosResponse<FeedResponse>> =>
    api.get<FeedResponse>('/api/v1/echos/feed', {
      params: { page, limit },
    }),

  getPending: (page = 1, limit = 50) =>
  api.get<{ results: Echo[]; page?: number; limit?: number }>(
    '/api/v1/echos/pending',
    { params: { page, limit } }
  ),


  triggerGoLive: (echoId: string) =>
    api.post(`/api/v1/echos/${echoId}/golive`),
  
  deleteEcho: (echoId: string) => api.delete(`/api/v1/echos/${echoId}`),
  updateCaption: (echoId: string, data: { caption?: string }) =>
    api.patch(`/api/v1/echos/${echoId}/caption`, data),
};

export { BASE_URL };
export default api;
