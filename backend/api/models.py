from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True)
    github_username = models.CharField(max_length=100, blank=True)
    points = models.IntegerField(default=0)

    def get_level(self):
        return max(1, self.points // 100)

    def get_avatar(self):
        level = self.get_level()
        if level <= 5:    return 'etudiant'
        elif level <= 15: return 'junior'
        elif level <= 30: return 'senior'
        else:             return 'expert'

    def __str__(self):
        return self.username


class Competence(models.Model):
    CATEGORIES = [
        ('frontend', 'Frontend'),
        ('backend', 'Backend'),
        ('devops', 'DevOps'),
        ('data', 'Data'),
        ('autre', 'Autre'),
    ]
    nom = models.CharField(max_length=100)
    categorie = models.CharField(max_length=50, choices=CATEGORIES)
    niveau_requis = models.IntegerField(default=1)

    def __str__(self):
        return self.nom


class UserCompetence(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competences')
    competence = models.ForeignKey(Competence, on_delete=models.CASCADE)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'competence')


class Quete(models.Model):
    TYPES = [
        ('github_repo',    'Créer un repo GitHub'),
        ('github_commit',  'Faire des commits GitHub'),
        ('github_file',    'Fichier requis dans repo'),
        ('quiz',           'Quiz technique'),
        ('url_submit',     'Soumettre une URL'),
        ('admin_review',   'Validation formateur'),
    ]

    titre = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField(help_text="Instructions détaillées pour l'utilisateur")
    points = models.IntegerField(default=50)
    type_quete = models.CharField(max_length=50, choices=TYPES)
    icone = models.CharField(max_length=10, default='⚔️')
    difficulte = models.IntegerField(default=1, help_text="1=Facile 2=Moyen 3=Difficile")

    # Paramètres de validation automatique
    # Pour github_repo    : repo_name_contains (ex: "portfolio")
    # Pour github_commit  : min_commits (ex: "5")
    # Pour github_file    : file_path (ex: "README.md,Dockerfile")
    # Pour quiz           : JSON {"q":"question","choices":["a","b","c"],"answer":"a"}
    # Pour url_submit     : url_pattern (ex: "github.com" ou vide = toute URL)
    validation_config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.titre


class UserQuete(models.Model):
    STATUTS = [
        ('non_commence',  'Non commencé'),
        ('en_cours',      'En cours'),
        ('soumis',        'Soumis - en attente'),
        ('valide',        'Validé ✅'),
        ('refuse',        'Refusé ❌'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quetes')
    quete = models.ForeignKey(Quete, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUTS, default='non_commence')

    # Ce que l'utilisateur soumet pour validation
    soumission = models.TextField(blank=True, help_text="URL, réponse quiz, username GitHub...")
    soumission_data = models.JSONField(default=dict, blank=True)

    # Feedback
    feedback = models.TextField(blank=True, help_text="Message de validation ou refus")
    date_soumission = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)

    # Points gagnés (0 si refusé)
    points_gagnes = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'quete')

    @property
    def completee(self):
        return self.statut == 'valide'

    def __str__(self):
        return f"{self.user.username} - {self.quete.titre} ({self.statut})"
