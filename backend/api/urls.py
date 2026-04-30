from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register),

    # Filières (public — pour le formulaire d'inscription)
    path('filieres/', views.liste_filieres),

    # Profil
    path('profil/', views.profil),

    # Compétences
    path('competences/', views.liste_competences),
    path('competences/mes/', views.mes_competences),

    # Quêtes
    path('quetes/', views.mes_quetes),
    path('quetes/<int:quete_id>/soumettre/', views.soumettre_quete),
    path('quetes/<int:quete_id>/reessayer/', views.reessayer_quete),

    # Classement
    path('classement/', views.classement),

    # GitHub
    path('github/<str:username>/', views.github_repos),

    # ── ADMIN ──
    path('admin/stats/',                              views.admin_stats),
    path('admin/users/',                              views.admin_liste_users),
    path('admin/users/<int:user_id>/',                views.admin_supprimer_user),
    path('admin/quetes/',                             views.admin_quetes),
    path('admin/quetes/<int:quete_id>/',              views.admin_quete_detail),
    path('admin/competences/',                        views.admin_competences),
    path('admin/competences/<int:comp_id>/',          views.admin_competence_detail),
    path('admin/soumissions/',                        views.admin_soumissions_attente),
    path('admin/soumissions/<int:userquete_id>/valider/', views.admin_valider_soumission),
    path('admin/ecoles/',                             views.admin_ecoles),
    path('admin/ecoles/<int:ecole_id>/',              views.admin_ecole_detail),
    path('admin/filieres/',                           views.admin_filieres),
    path('admin/filieres/<int:filiere_id>/',          views.admin_filiere_detail),
]