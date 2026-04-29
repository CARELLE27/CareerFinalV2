# 🎮 CareerQuest — RPG Développement Carrière

Application gamifiée de développement professionnel — B3PRJ2 Hackathon

---

## 🚀 Démarrage rapide

### Prérequis
- Docker & Docker Compose installés

### Lancer l'application

```bash
git clone <url-du-repo>
cd careerquest

# 1. Lancer les conteneurs
docker compose up --build

# 2. Dans un second terminal — migrations
docker exec careerquest_backend python manage.py makemigrations api
docker exec careerquest_backend python manage.py migrate

# 3. Charger les données initiales
docker exec careerquest_backend python manage.py loaddata api/fixtures/initial_data.json

# 4. Créer un admin (optionnel)
docker exec -it careerquest_backend python manage.py createsuperuser
```

Ouvrir **http://localhost:3000** dans le navigateur.

---

## 🏗️ Architecture

```
careerquest/
├── docker-compose.yml
├── .gitlab-ci.yml
├── backend/                     ← Django REST API
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── careerquest/
│   │   ├── settings.py
│   │   └── urls.py
│   └── api/
│       ├── models.py            ← User, Competences, Quetes
│       ├── views.py             ← Endpoints API
│       ├── serializers.py
│       ├── validators.py        ← Validation GitHub, Quiz, URL
│       ├── urls.py
│       └── fixtures/
│           └── initial_data.json
└── frontend/                    ← React
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── App.js / App.css
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── Profil.js
        │   ├── Quetes.js
        │   └── Classement.js
        ├── components/
        │   ├── Navbar.js
        │   ├── Avatar.js
        │   └── ProgressBar.js
        └── services/
            └── api.js
```

---

## 📡 API Endpoints

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| POST | `/api/auth/register/` | Créer un compte | ❌ |
| POST | `/api/token/` | Login → JWT | ❌ |
| GET/PUT | `/api/profil/` | Mon profil | ✅ |
| GET | `/api/competences/` | Liste compétences | ❌ |
| GET/POST | `/api/competences/mes/` | Mes compétences | ✅ |
| GET | `/api/quetes/` | Mes quêtes | ✅ |
| POST | `/api/quetes/:id/soumettre/` | Soumettre une réponse | ✅ |
| POST | `/api/quetes/:id/reessayer/` | Réessayer une quête | ✅ |
| GET | `/api/classement/` | Top 10 | ❌ |
| GET | `/api/github/:username/` | Repos GitHub | ✅ |
| GET | `/api/admin/soumissions/` | Soumissions en attente | 🔐 Admin |
| POST | `/api/admin/valider/:id/` | Valider/refuser | 🔐 Admin |

---

## 🎮 Système de progression

| Avatar | Niveau | XP requis |
|--------|--------|-----------|
| 🧑‍💻 Étudiant | 1-5 | 0-499 XP |
| 👨‍🔬 Junior | 6-15 | 500-1499 XP |
| 🧙‍♂️ Senior | 16-30 | 1500-2999 XP |
| 🦸 Expert | 31+ | 3000+ XP |

## ⚔️ Types de quêtes

| Type | Validation |
|------|-----------|
| github_repo | Vérification automatique via API GitHub |
| github_commit | Compte les commits réels |
| github_file | Vérifie les fichiers présents dans le repo |
| quiz | Bonne réponse = points |
| url_submit | Vérifie que l'URL est accessible |
| admin_review | Validation manuelle par le formateur |

---

## 👥 Équipe

| Rôle | Responsabilité |
|------|---------------|
| Frontend | React, pages, CSS |
| Backend | Django, API REST, validateurs |
| DevOps | Docker, GitLab CI, déploiement |
