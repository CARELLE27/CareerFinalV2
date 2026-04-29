import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register  = (data) => api.post('/auth/register/', data);
export const login     = (data) => api.post('/token/', data);

// Profil
export const getProfil    = ()     => api.get('/profil/');
export const updateProfil = (data) => api.put('/profil/', data);

// Compétences
export const getCompetences    = ()     => api.get('/competences/');
export const getMesCompetences = ()     => api.get('/competences/mes/');
export const ajouterCompetence = (id)   => api.post('/competences/mes/', { competence_id: id });
export const supprimerCompetence = (id) => api.delete('/competences/mes/', { data: { competence_id: id } });

// Quêtes
export const getMesQuetes   = ()              => api.get('/quetes/');
export const getDetailQuete = (id)            => api.get(`/quetes/${id}/`);
export const soumettreQuete = (id, soumission) => api.post(`/quetes/${id}/soumettre/`, { soumission });
export const reessayerQuete = (id)            => api.post(`/quetes/${id}/reessayer/`);

// Classement
export const getClassement = () => api.get('/classement/');

// GitHub
export const connectGithub = (username) => api.get(`/github/${username}/`);

export default api;
