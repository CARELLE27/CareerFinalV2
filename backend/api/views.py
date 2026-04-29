from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
import requests

from .models import User, Competence, UserCompetence, Quete, UserQuete
from .serializers import (UserSerializer, RegisterSerializer,
                           CompetenceSerializer, UserCompetenceSerializer,
                           QueteSerializer, UserQueteSerializer)
from .validators import valider_quete


# ─── AUTH ─────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        for quete in Quete.objects.all():
            UserQuete.objects.create(user=user, quete=quete)
        return Response({'message': 'Compte créé avec succès'}, status=201)
    return Response(serializer.errors, status=400)


# ─── PROFIL ───────────────────────────────────────────────
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profil(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# ─── COMPÉTENCES ──────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def liste_competences(request):
    return Response(CompetenceSerializer(Competence.objects.all(), many=True).data)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def mes_competences(request):
    if request.method == 'GET':
        uc = UserCompetence.objects.filter(user=request.user)
        return Response(UserCompetenceSerializer(uc, many=True).data)

    if request.method == 'POST':
        cid = request.data.get('competence_id')
        if UserCompetence.objects.filter(user=request.user, competence_id=cid).exists():
            return Response({'error': 'Compétence déjà ajoutée'}, status=400)
        uc = UserCompetence.objects.create(user=request.user, competence_id=cid)
        request.user.points += 20
        request.user.save()
        return Response(UserCompetenceSerializer(uc).data, status=201)

    if request.method == 'DELETE':
        UserCompetence.objects.filter(user=request.user,
                                      competence_id=request.data.get('competence_id')).delete()
        return Response({'message': 'Compétence supprimée'})


# ─── QUÊTES ───────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_quetes(request):
    """Retourne toutes les quêtes avec leur statut pour le user connecté."""
    uqs = UserQuete.objects.filter(user=request.user).select_related('quete')
    return Response(UserQueteSerializer(uqs, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def detail_quete(request, quete_id):
    """Retourne les détails et instructions d'une quête."""
    try:
        quete = Quete.objects.get(pk=quete_id)
        return Response(QueteSerializer(quete).data)
    except Quete.DoesNotExist:
        return Response({'error': 'Quête introuvable'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soumettre_quete(request, quete_id):
    """
    L'utilisateur soumet sa réponse/preuve pour une quête.
    Body: { "soumission": "valeur" }
    
    Selon le type de quête :
    - github_repo    → nom du repo GitHub
    - github_commit  → nom du repo GitHub  
    - github_file    → nom du repo GitHub
    - quiz           → lettre de la réponse (a, b, c, d)
    - url_submit     → URL du projet déployé
    - admin_review   → description de ce qui a été fait
    """
    try:
        uq = UserQuete.objects.get(user=request.user, quete_id=quete_id)
    except UserQuete.DoesNotExist:
        return Response({'error': 'Quête introuvable'}, status=404)

    if uq.statut == 'valide':
        return Response({'error': 'Cette quête est déjà validée !'}, status=400)

    if uq.statut == 'soumis':
        return Response({'error': 'Soumission déjà en attente de validation.'}, status=400)

    soumission = request.data.get('soumission', '').strip()
    if not soumission:
        return Response({'error': 'Veuillez fournir une réponse ou une preuve.'}, status=400)

    # Sauvegarder la soumission
    uq.soumission = soumission
    uq.date_soumission = timezone.now()

    # Lancer la validation
    succes, feedback, points = valider_quete(uq, soumission)

    if succes is None:
        # Validation manuelle en attente (admin_review)
        uq.statut = 'soumis'
        uq.feedback = feedback
        uq.save()
        return Response({
            'statut': 'soumis',
            'message': feedback,
        })

    elif succes:
        uq.statut = 'valide'
        uq.feedback = feedback
        uq.points_gagnes = points
        uq.date_validation = timezone.now()
        uq.save()

        # Ajouter les points au user
        request.user.points += points
        request.user.save()

        return Response({
            'statut': 'valide',
            'message': feedback,
            'points_gagnes': points,
            'points_total': request.user.points,
            'level': request.user.get_level(),
            'avatar': request.user.get_avatar(),
        })

    else:
        # Échec de validation
        uq.statut = 'refuse'
        uq.feedback = feedback
        uq.save()

        return Response({
            'statut': 'refuse',
            'message': feedback,
            'points_gagnes': 0,
        }, status=422)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reessayer_quete(request, quete_id):
    """Permet de reessayer une quête refusée."""
    try:
        uq = UserQuete.objects.get(user=request.user, quete_id=quete_id)
    except UserQuete.DoesNotExist:
        return Response({'error': 'Quête introuvable'}, status=404)

    if uq.statut == 'valide':
        return Response({'error': 'Quête déjà validée !'}, status=400)

    uq.statut = 'non_commence'
    uq.soumission = ''
    uq.feedback = ''
    uq.save()
    return Response({'message': 'Vous pouvez maintenant reessayer cette quête.'})


# ─── VALIDATION ADMIN ─────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_valider_quete(request, userquete_id):
    """
    Endpoint admin pour valider/refuser manuellement une soumission.
    Body: { "decision": "valide" | "refuse", "feedback": "message" }
    """
    try:
        uq = UserQuete.objects.get(pk=userquete_id)
    except UserQuete.DoesNotExist:
        return Response({'error': 'Soumission introuvable'}, status=404)

    decision = request.data.get('decision')
    feedback = request.data.get('feedback', '')

    if decision == 'valide':
        uq.statut = 'valide'
        uq.feedback = feedback or '✅ Validé par le formateur'
        uq.points_gagnes = uq.quete.points
        uq.date_validation = timezone.now()
        uq.save()

        uq.user.points += uq.quete.points
        uq.user.save()
        return Response({'message': f'Quête validée pour {uq.user.username} (+{uq.quete.points} XP)'})

    elif decision == 'refuse':
        uq.statut = 'refuse'
        uq.feedback = feedback or '❌ Non validé par le formateur'
        uq.save()
        return Response({'message': f'Quête refusée pour {uq.user.username}'})

    return Response({'error': 'decision doit être valide ou refuse'}, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_soumissions_en_attente(request):
    """Liste toutes les soumissions en attente de validation admin."""
    uqs = UserQuete.objects.filter(statut='soumis').select_related('user', 'quete')
    data = [{
        'id': uq.id,
        'user': uq.user.username,
        'quete': uq.quete.titre,
        'soumission': uq.soumission,
        'date_soumission': uq.date_soumission,
    } for uq in uqs]
    return Response(data)


# ─── CLASSEMENT ───────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def classement(request):
    users = User.objects.order_by('-points')[:10]
    data = [{
        'rang': i + 1,
        'username': u.username,
        'points': u.points,
        'level': u.get_level(),
        'avatar': u.get_avatar(),
        'quetes_completees': UserQuete.objects.filter(user=u, statut='valide').count(),
    } for i, u in enumerate(users)]
    return Response(data)


# ─── GITHUB ───────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def github_repos(request, username):
    try:
        r = requests.get(
            f'https://api.github.com/users/{username}/repos',
            headers={'Accept': 'application/vnd.github.v3+json'},
            timeout=5
        )
        repos = r.json()
        nb = len(repos) if isinstance(repos, list) else 0
        bonus = nb * 10
        request.user.points += bonus
        request.user.github_username = username
        request.user.save()
        return Response({
            'repos': repos[:10],
            'bonus_points': bonus,
            'message': f'GitHub connecté ! +{bonus} XP pour {nb} repos'
        })
    except Exception:
        return Response({'error': 'Impossible de contacter GitHub'}, status=500)
