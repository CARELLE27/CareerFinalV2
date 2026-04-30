import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: `${API_URL}/api` });

// Intercepteur REQUEST
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur RESPONSE — gère les 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register/', data);
export const login    = (data) => api.post('/token/', data);

// ── FILIÈRES ──────────────────────────────────────────────
export const getFilieres = () => api.get('/filieres/');

// ── PROFIL ────────────────────────────────────────────────
export const getProfil    = ()     => api.get('/profil/');
export const updateProfil = (data) => api.put('/profil/', data);

// ── COMPÉTENCES UTILISATEUR ───────────────────────────────
export const getCompetences           = ()    => api.get('/competences/');
export const getMesCompetences        = ()    => api.get('/competences/mes/');
export const ajouterCompetence        = (id)  => api.post('/competences/mes/', { competence_id: id });
export const supprimerMaCompetence    = (id)  => api.delete('/competences/mes/', { data: { competence_id: id } });

// ── QUÊTES ────────────────────────────────────────────────
export const getMesQuetes    = ()               => api.get('/quetes/');
export const soumettreQuete  = (id, soumission) => api.post(`/quetes/${id}/soumettre/`, { soumission });
export const reessayerQuete  = (id)             => api.post(`/quetes/${id}/reessayer/`);

// ── CLASSEMENT ────────────────────────────────────────────
export const getClassement        = ()        => api.get('/classement/');
export const getClassementFiliere = (filiere) => api.get(`/classement/?filiere=${filiere}`);

// ── GITHUB ────────────────────────────────────────────────
export const connectGithub = (username) => api.get(`/github/${username}/`);

// ── ADMIN ─────────────────────────────────────────────────
export const getAdminStats       = ()              => api.get('/admin/stats/');
export const getAdminUsers       = ()              => api.get('/admin/users/');
export const supprimerUser       = (id)            => api.delete(`/admin/users/${id}/`);
export const getAdminQuetes      = ()              => api.get('/admin/quetes/');
export const creerQuete          = (data)          => api.post('/admin/quetes/', data);
export const modifierQuete       = (id, data)      => api.put(`/admin/quetes/${id}/`, data);
export const supprimerQuete      = (id)            => api.delete(`/admin/quetes/${id}/`);
export const getAdminCompetences = ()              => api.get('/admin/competences/');
export const creerCompetence     = (data)          => api.post('/admin/competences/', data);
export const modifierCompetence  = (id, data)      => api.put(`/admin/competences/${id}/`, data);
export const supprimerCompetence = (id)            => api.delete(`/admin/competences/${id}/`);
export const getAdminSoumissions = ()              => api.get('/admin/soumissions/');
export const validerSoumission   = (id, decision, feedback) =>
  api.post(`/admin/soumissions/${id}/valider/`, { decision, feedback });

export default api;