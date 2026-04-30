from rest_framework import serializers
from .models import User, Competence, UserCompetence, Quete, UserQuete


class UserSerializer(serializers.ModelSerializer):
    level           = serializers.SerializerMethodField()
    avatar          = serializers.SerializerMethodField()
    filieres_labels = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'bio', 'github_username',
                  'points', 'level', 'avatar', 'is_formateur', 'is_staff',
                  'ecole', 'filieres', 'filieres_labels']

    def get_level(self, obj):           return obj.get_level()
    def get_avatar(self, obj):          return obj.get_avatar()
    def get_filieres_labels(self, obj): return obj.get_filieres_labels()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password', 'ecole', 'filieres']

    def create(self, validated_data):
        return User.objects.create_user(
            username = validated_data['username'],
            email    = validated_data['email'],
            password = validated_data['password'],
            ecole    = validated_data.get('ecole', ''),
            filieres = validated_data.get('filieres', []),
        )


class CompetenceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Competence
        fields = ['id', 'nom', 'categorie', 'niveau_requis', 'description', 'filieres_cibles']


class UserCompetenceSerializer(serializers.ModelSerializer):
    competence    = CompetenceSerializer(read_only=True)
    competence_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = UserCompetence
        fields = ['id', 'competence', 'competence_id', 'date_ajout', 'auto_debloquee']


class QueteSerializer(serializers.ModelSerializer):
    competences_debloquees = CompetenceSerializer(many=True, read_only=True)

    class Meta:
        model  = Quete
        fields = ['id', 'titre', 'description', 'instructions', 'points',
                  'type_quete', 'icone', 'difficulte', 'validation_config',
                  'filieres_cibles', 'competences_debloquees']


class QueteAdminSerializer(serializers.ModelSerializer):
    competences_debloquees_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Competence.objects.all(),
        source='competences_debloquees', required=False
    )
    competences_debloquees = CompetenceSerializer(many=True, read_only=True)

    class Meta:
        model  = Quete
        fields = ['id', 'titre', 'description', 'instructions', 'points',
                  'type_quete', 'icone', 'difficulte', 'validation_config',
                  'active', 'filieres_cibles',
                  'competences_debloquees', 'competences_debloquees_ids']


class UserQueteSerializer(serializers.ModelSerializer):
    quete         = QueteSerializer(read_only=True)
    points_gagnes = serializers.IntegerField(read_only=True)

    class Meta:
        model  = UserQuete
        fields = ['id', 'quete', 'statut', 'soumission', 'feedback',
                  'date_soumission', 'date_validation', 'points_gagnes', 'recommandee']