# Remplacer dans backend/api/models.py
# Le champ filiere devient filieres (multiple)
# Et FILIERES remplace "autre" par "culture_generale"

from django.contrib.auth.models import AbstractUser
from django.db import models

FILIERES = [
    ('informatique',       '💻 Informatique'),
    ('litterature',        '📚 Littérature'),
    ('langues',            '🌍 Langues'),
    ('mathematiques',      '📐 Mathématiques'),
    ('sciences_physiques', '⚗️ Sciences Physiques'),
    ('sante',              '🏥 Santé'),
    ('sciences_naturelles','🌿 Sciences Naturelles'),
    ('culture_generale',   '🎓 Culture Générale'),  # ← Remplace "autre"
]


class Ecole(models.Model):
    """Écoles gérées par l'admin depuis le dashboard."""
    nom      = models.CharField(max_length=200, unique=True)
    ville    = models.CharField(max_length=100, blank=True)
    pays     = models.CharField(max_length=100, default='France')
    active   = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']


class Filiere(models.Model):
    """Filières gérées par l'admin depuis le dashboard."""
    code     = models.CharField(max_length=50, unique=True)
    label    = models.CharField(max_length=100)
    icone    = models.CharField(max_length=10, default='🎓')
    active   = models.BooleanField(default=True)
    ordre    = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.icone} {self.label}"

    class Meta:
        ordering = ['ordre', 'label']


class User(AbstractUser):
    bio             = models.TextField(blank=True)
    github_username = models.CharField(max_length=100, blank=True)
    points          = models.IntegerField(default=0)
    is_formateur    = models.BooleanField(default=False)
    ecole           = models.CharField(max_length=200, blank=True)

    # ✅ FILIERES MULTIPLES — stockées en JSON ["informatique","mathematiques"]
    filieres        = models.JSONField(default=list, blank=True)

    def get_level(self):
        return max(1, self.points // 100)

    def get_avatar(self):
        level = self.get_level()
        if level <= 5:    return 'etudiant'
        elif level <= 15: return 'junior'
        elif level <= 30: return 'senior'
        else:             return 'expert'

    def get_filieres_labels(self):
        """Retourne les labels lisibles des filières de l'utilisateur."""
        from .models import Filiere as FiliereModel
        labels = []
        for code in (self.filieres or []):
            f = FiliereModel.objects.filter(code=code, active=True).first()
            if f:
                labels.append(f"{f.icone} {f.label}")
            else:
                # Fallback sur le dict statique
                d = dict(FILIERES)
                if code in d:
                    labels.append(d[code])
        return labels

    def __str__(self):
        return self.username


class Competence(models.Model):
    CATEGORIES = [
        ('frontend',  'Frontend'),
        ('backend',   'Backend'),
        ('devops',    'DevOps'),
        ('data',      'Data'),
        ('redaction', 'Rédaction'),
        ('langues',   'Langues'),
        ('sciences',  'Sciences'),
        ('sante',     'Santé'),
        ('maths',     'Mathématiques'),
        ('autre',     'Autre'),
    ]
    nom             = models.CharField(max_length=100)
    categorie       = models.CharField(max_length=50, choices=CATEGORIES)
    niveau_requis   = models.IntegerField(default=1)
    description     = models.TextField(blank=True)
    filieres_cibles = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.nom


class UserCompetence(models.Model):
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='competences')
    competence     = models.ForeignKey(Competence, on_delete=models.CASCADE)
    date_ajout     = models.DateTimeField(auto_now_add=True)
    auto_debloquee = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'competence')


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

    titre             = models.CharField(max_length=200)
    description       = models.TextField()
    instructions      = models.TextField()
    points            = models.IntegerField(default=50)
    type_quete        = models.CharField(max_length=50, choices=TYPES)
    icone             = models.CharField(max_length=10, default='⚔️')
    difficulte        = models.IntegerField(default=1, choices=DIFFICULTES)
    validation_config = models.JSONField(default=dict, blank=True)
    active            = models.BooleanField(default=True)
    filieres_cibles   = models.JSONField(default=list, blank=True)
    competences_debloquees = models.ManyToManyField(
        Competence, blank=True, related_name='quetes_associees'
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
    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quetes')
    quete           = models.ForeignKey(Quete, on_delete=models.CASCADE)
    statut          = models.CharField(max_length=20, choices=STATUTS, default='non_commence')
    soumission      = models.TextField(blank=True)
    soumission_data = models.JSONField(default=dict, blank=True)
    feedback        = models.TextField(blank=True)
    date_soumission = models.DateTimeField(null=True, blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    points_gagnes   = models.IntegerField(default=0)
    recommandee     = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'quete')

    @property
    def completee(self):
        return self.statut == 'valide'
