from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True)
    github_username = models.CharField(max_length=100, blank=True)
    points = models.IntegerField(default=0)
    is_formateur = models.BooleanField(default=False)

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
    description = models.TextField(blank=True)

    def __str__(self):
        return self.nom


class UserCompetence(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competences')
    competence = models.ForeignKey(Competence, on_delete=models.CASCADE)
    date_ajout = models.DateTimeField(auto_now_add=True)
    auto_debloquee = models.BooleanField(default=False)  # True si débloquée via quête

    class Meta:
        unique_together = ('user', 'competence')

    def __str__(self):
        return f"{self.user.username} - {self.competence.nom}"


class Quete(models.Model):
    TYPES = [
        ('github_repo',   'Créer un repo GitHub'),
        ('github_commit', 'Faire des commits GitHub'),
        ('github_file',   'Fichier requis dans repo'),
        ('quiz',          'Quiz technique'),
        ('url_submit',    'Soumettre une URL'),
        ('admin_review',  'Validation formateur'),
    ]
    DIFFICULTES = [(1, 'Facile'), (2, 'Moyen'), (3, 'Difficile')]

    titre = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField()
    points = models.IntegerField(default=50)
    type_quete = models.CharField(max_length=50, choices=TYPES)
    icone = models.CharField(max_length=10, default='⚔️')
    difficulte = models.IntegerField(default=1, choices=DIFFICULTES)
    validation_config = models.JSONField(default=dict, blank=True)
    active = models.BooleanField(default=True)

    # ✅ NOUVEAU : compétences débloquées automatiquement quand cette quête est validée
    competences_debloquees = models.ManyToManyField(
        Competence,
        blank=True,
        related_name='quetes_associees',
        help_text="Compétences ajoutées automatiquement au profil quand cette quête est validée"
    )

    def __str__(self):
        return self.titre


class UserQuete(models.Model):
    STATUTS = [
        ('non_commence', 'Non commencé'),
        ('en_cours',     'En cours'),
        ('soumis',       'Soumis - en attente'),
        ('valide',       'Validé ✅'),
        ('refuse',       'Refusé ❌'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quetes')
    quete = models.ForeignKey(Quete, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUTS, default='non_commence')
    soumission = models.TextField(blank=True)
    soumission_data = models.JSONField(default=dict, blank=True)
    feedback = models.TextField(blank=True)
    date_soumission = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    points_gagnes = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'quete')

    @property
    def completee(self):
        return self.statut == 'valide'

    def __str__(self):
        return f"{self.user.username} - {self.quete.titre} ({self.statut})"
