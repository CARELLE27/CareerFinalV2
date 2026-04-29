from rest_framework import serializers
from .models import User, Competence, UserCompetence, Quete, UserQuete


class UserSerializer(serializers.ModelSerializer):
    level  = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'bio', 'github_username', 'points', 'level', 'avatar']

    def get_level(self, obj):  return obj.get_level()
    def get_avatar(self, obj): return obj.get_avatar()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CompetenceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Competence
        fields = '__all__'


class UserCompetenceSerializer(serializers.ModelSerializer):
    competence    = CompetenceSerializer(read_only=True)
    competence_id = serializers.IntegerField(write_only=True)

    class Meta:
        model  = UserCompetence
        fields = ['id', 'competence', 'competence_id', 'date_ajout']


class QueteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Quete
        fields = ['id', 'titre', 'description', 'instructions', 'points',
                  'type_quete', 'icone', 'difficulte', 'validation_config']


class UserQueteSerializer(serializers.ModelSerializer):
    quete        = QueteSerializer(read_only=True)
    points_gagnes = serializers.IntegerField(read_only=True)

    class Meta:
        model  = UserQuete
        fields = ['id', 'quete', 'statut', 'soumission', 'feedback',
                  'date_soumission', 'date_validation', 'points_gagnes']
