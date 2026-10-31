import axios from 'axios';
import { API_BASE_URL } from '../constants/api.js';
export const api=axios.create({baseURL:API_BASE_URL});
api.interceptors.request.use(config=>{const token=localStorage.getItem('edtech-token');if(token)config.headers.Authorization=`Bearer ${token}`;return config;});
api.interceptors.response.use(r=>r,e=>{if(e.response?.status===401&&localStorage.getItem('edtech-token')){localStorage.removeItem('edtech-token');localStorage.removeItem('edtech-admin');window.location.assign('/admin/login');}return Promise.reject(e);});
export const labels={PARENT:'Parent',STUDENT:'Student',SCHOOL:'School',SCHOLARSHIP:'Scholarship',CONCERT:'Concert',ADMISSION:'Admission',GENERAL_QUERY:'General Query',NEW:'New',IN_PROGRESS:'In Progress',RESOLVED:'Resolved'};
export const errorMessage=e=>e.response?.data?.message||'Something went wrong. Please try again.';
