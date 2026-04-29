from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register),

    # Profil
    path('profil/', views.profil),

    # Compétences
    path('competences/', views.liste_competences),
    path('competences/mes/', views.mes_competences),

    # Quêtes
    path('quetes/', views.mes_quetes),
    path('quetes/<int:quete_id>/', views.detail_quete),
    path('quetes/<int:quete_id>/soumettre/', views.soumettre_quete),
    path('quetes/<int:quete_id>/reessayer/', views.reessayer_quete),

    # Admin
    path('admin/soumissions/', views.admin_soumissions_en_attente),
    path('admin/valider/<int:userquete_id>/', views.admin_valider_quete),

    # Classement
    path('classement/', views.classement),

    # GitHub
    path('github/<str:username>/', views.github_repos),
]
