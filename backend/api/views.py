from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum
import requests

from .models import User, Competence, UserCompetence, Quete, UserQuete, FILIERES, Ecole, Filiere
from .serializers import (
    UserSerializer, RegisterSerializer, CompetenceSerializer,
    UserCompetenceSerializer, QueteSerializer, QueteAdminSerializer,
    UserQueteSerializer
)
from .validators import valider_quete


# ─── UTILITAIRES ─────────────────────────────────────────────────────────
def debloquer_competences_auto(user, quete):
    nouvelles = []
    for competence in quete.competences_debloquees.all():
        uc, created = UserCompetence.objects.get_or_create(
            user=user, competence=competence,
            defaults={'auto_debloquee': True}
        )
        if created:
            user.points += 20
            nouvelles.append(competence.nom)
    if nouvelles:
        user.save()
    return nouvelles


def is_admin_or_formateur(user):
    return user.is_staff or user.is_superuser or user.is_formateur


def user_recommande_quete(user, quete):
    """Retourne True si la quête est recommandée pour au moins une filière de l'user."""
    if not quete.filieres_cibles:
        return True  # quête commune = recommandée pour tout le monde
    return any(f in quete.filieres_cibles for f in (user.filieres or []))


# ─── AUTH ────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        for quete in Quete.objects.filter(active=True):
            recommandee = user_recommande_quete(user, quete)
            UserQuete.objects.create(user=user, quete=quete, recommandee=recommandee)
        return Response({'message': 'Compte créé avec succès'}, status=201)
    return Response(serializer.errors, status=400)


# ─── PROFIL ──────────────────────────────────────────────────────────────
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


# ─── FILIÈRES ────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def liste_filieres(request):
    filieres = Filiere.objects.filter(active=True).order_by('ordre', 'label')
    return Response([{
        'value': f.code,
        'label': f"{f.icone} {f.label}",
    } for f in filieres])


# ─── COMPÉTENCES ─────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liste_competences(request):
    """Compétences filtrées selon les filières de l'utilisateur."""
    user_filieres = request.user.filieres or []
    all_comps = Competence.objects.all()
    result = [c for c in all_comps
              if not c.filieres_cibles or
              any(f in c.filieres_cibles for f in user_filieres)]
    return Response(CompetenceSerializer(result, many=True).data)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def mes_competences(request):
    if request.method == 'GET':
        uc = UserCompetence.objects.filter(user=request.user).select_related('competence')
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
        UserCompetence.objects.filter(
            user=request.user, competence_id=request.data.get('competence_id')
        ).delete()
        return Response({'message': 'Compétence supprimée'})


# ─── QUÊTES ──────────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_quetes(request):
    uqs = (UserQuete.objects
           .filter(user=request.user)
           .select_related('quete')
           .prefetch_related('quete__competences_debloquees')
           .order_by('-recommandee', 'quete__difficulte'))
    return Response(UserQueteSerializer(uqs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soumettre_quete(request, quete_id):
    try:
        uq = UserQuete.objects.get(user=request.user, quete_id=quete_id)
    except UserQuete.DoesNotExist:
        return Response({'error': 'Quête introuvable'}, status=404)

    if uq.statut == 'valide':
        return Response({'error': 'Quête déjà validée !'}, status=400)
    if uq.statut == 'soumis':
        return Response({'error': 'Soumission déjà en attente.'}, status=400)

    soumission = request.data.get('soumission', '').strip()
    if not soumission:
        return Response({'error': 'Veuillez fournir une réponse.'}, status=400)

    uq.soumission = soumission
    uq.date_soumission = timezone.now()

    succes, feedback, points = valider_quete(uq, soumission)

    if succes is None:
        uq.statut = 'soumis'
        uq.feedback = feedback
        uq.save()
        return Response({'statut': 'soumis', 'message': feedback})

    elif succes:
        uq.statut = 'valide'
        uq.feedback = feedback
        uq.points_gagnes = points
        uq.date_validation = timezone.now()
        uq.save()
        request.user.points += points
        request.user.save()
        nouvelles_competences = debloquer_competences_auto(request.user, uq.quete)
        return Response({
            'statut':                 'valide',
            'message':                feedback,
            'points_gagnes':          points,
            'points_total':           request.user.points,
            'level':                  request.user.get_level(),
            'avatar':                 request.user.get_avatar(),
            'competences_debloquees': nouvelles_competences,
        })
    else:
        uq.statut = 'refuse'
        uq.feedback = feedback
        uq.save()
        return Response({
            'statut':        'refuse',
            'message':       feedback,
            'points_gagnes': 0,
        }, status=422)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reessayer_quete(request, quete_id):
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
    return Response({'message': 'Vous pouvez réessayer.'})


# ─── CLASSEMENT ──────────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([AllowAny])
def classement(request):
    filiere = request.query_params.get('filiere', None)
    users = User.objects.order_by('-points')
    if filiere:
        users = [u for u in users if filiere in (u.filieres or [])]
    else:
        users = list(users)
    users = users[:10]
    return Response([{
        'rang':              i + 1,
        'username':          u.username,
        'points':            u.points,
        'level':             u.get_level(),
        'avatar':            u.get_avatar(),
        'ecole':             u.ecole,
        'filieres':          u.filieres,
        'filieres_labels':   u.get_filieres_labels(),
        'quetes_completees': UserQuete.objects.filter(user=u, statut='valide').count(),
    } for i, u in enumerate(users)])


# ─── GITHUB ──────────────────────────────────────────────────────────────
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
            'repos':        repos[:10],
            'bonus_points': bonus,
            'message':      f'GitHub connecté ! +{bonus} XP pour {nb} repos'
        })
    except Exception:
        return Response({'error': 'Impossible de contacter GitHub'}, status=500)


# ════════════════════════════════════════════════════════════
# ADMIN
# ════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)

    stats_filieres = []
    for f in Filiere.objects.filter(active=True):
        nb = sum(1 for u in User.objects.all() if f.code in (u.filieres or []))
        if nb > 0:
            stats_filieres.append({'filiere': f.code, 'label': f"{f.icone} {f.label}", 'nb_users': nb})

    top = User.objects.order_by('-points').first()
    return Response({
        'total_users':        User.objects.count(),
        'total_quetes':       Quete.objects.count(),
        'total_validees':     UserQuete.objects.filter(statut='valide').count(),
        'total_en_attente':   UserQuete.objects.filter(statut='soumis').count(),
        'total_refuses':      UserQuete.objects.filter(statut='refuse').count(),
        'total_xp_distribue': User.objects.aggregate(Sum('points'))['points__sum'] or 0,
        'top_user':           top.username if top else '—',
        'top_user_points':    top.points if top else 0,
        'stats_filieres':     stats_filieres,
        'repartition': {
            'valide':       UserQuete.objects.filter(statut='valide').count(),
            'soumis':       UserQuete.objects.filter(statut='soumis').count(),
            'refuse':       UserQuete.objects.filter(statut='refuse').count(),
            'non_commence': UserQuete.objects.filter(statut='non_commence').count(),
        },
        'quetes_populaires': list(
            UserQuete.objects.filter(statut='valide')
            .values('quete__titre', 'quete__icone')
            .annotate(nb=Count('id'))
            .order_by('-nb')[:5]
        ),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_liste_users(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    users = User.objects.all().order_by('-points')
    return Response([{
        'id':              u.id,
        'username':        u.username,
        'email':           u.email,
        'ecole':           u.ecole,
        'filieres':        u.filieres,
        'filieres_labels': u.get_filieres_labels(),
        'points':          u.points,
        'level':           u.get_level(),
        'avatar':          u.get_avatar(),
        'github':          u.github_username,
        'is_formateur':    u.is_formateur,
        'is_staff':        u.is_staff,
        'date_joined':     u.date_joined,
        'quetes_validees': UserQuete.objects.filter(user=u, statut='valide').count(),
        'competences':     UserCompetence.objects.filter(user=u).count(),
    } for u in users])


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_supprimer_user(request, user_id):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        user = User.objects.get(pk=user_id)
        if user == request.user:
            return Response({'error': 'Impossible de se supprimer soi-même'}, status=400)
        username = user.username
        user.delete()
        return Response({'message': f'Utilisateur {username} supprimé'})
    except User.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=404)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_quetes(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'GET':
        quetes = Quete.objects.all().prefetch_related('competences_debloquees')
        data = []
        for q in quetes:
            d = QueteAdminSerializer(q).data
            d['nb_validations'] = UserQuete.objects.filter(quete=q, statut='valide').count()
            data.append(d)
        return Response(data)
    serializer = QueteAdminSerializer(data=request.data)
    if serializer.is_valid():
        quete = serializer.save()
        for user in User.objects.all():
            recommandee = user_recommande_quete(user, quete)
            UserQuete.objects.get_or_create(user=user, quete=quete, defaults={'recommandee': recommandee})
        return Response(QueteAdminSerializer(quete).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_quete_detail(request, quete_id):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        quete = Quete.objects.get(pk=quete_id)
    except Quete.DoesNotExist:
        return Response({'error': 'Quête introuvable'}, status=404)
    if request.method == 'GET':
        return Response(QueteAdminSerializer(quete).data)
    if request.method == 'PUT':
        serializer = QueteAdminSerializer(quete, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    quete.delete()
    return Response({'message': 'Quête supprimée'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_competences(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'GET':
        comps = Competence.objects.all()
        data = []
        for c in comps:
            d = CompetenceSerializer(c).data
            d['nb_users'] = UserCompetence.objects.filter(competence=c).count()
            d['quetes_associees'] = list(c.quetes_associees.values('id', 'titre'))
            data.append(d)
        return Response(data)
    serializer = CompetenceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_competence_detail(request, comp_id):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        comp = Competence.objects.get(pk=comp_id)
    except Competence.DoesNotExist:
        return Response({'error': 'Compétence introuvable'}, status=404)
    if request.method == 'PUT':
        serializer = CompetenceSerializer(comp, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    comp.delete()
    return Response({'message': 'Compétence supprimée'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_soumissions_attente(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    uqs = UserQuete.objects.filter(statut='soumis').select_related('user', 'quete')
    return Response([{
        'id':              uq.id,
        'user':            uq.user.username,
        'user_ecole':      uq.user.ecole,
        'user_filiere':    ', '.join(uq.user.get_filieres_labels()),
        'quete':           uq.quete.titre,
        'quete_icone':     uq.quete.icone,
        'soumission':      uq.soumission,
        'date_soumission': uq.date_soumission,
        'points':          uq.quete.points,
    } for uq in uqs])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_valider_soumission(request, userquete_id):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
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
        nouvelles = debloquer_competences_auto(uq.user, uq.quete)
        return Response({
            'message':                f'Quête validée pour {uq.user.username} (+{uq.quete.points} XP)',
            'competences_debloquees': nouvelles,
        })
    elif decision == 'refuse':
        uq.statut = 'refuse'
        uq.feedback = feedback or '❌ Non validé par le formateur'
        uq.save()
        return Response({'message': f'Quête refusée pour {uq.user.username}'})
    return Response({'error': 'decision doit être "valide" ou "refuse"'}, status=400)


# ─── ADMIN ÉCOLES ────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_ecoles(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'GET':
        ecoles = Ecole.objects.filter(active=True)
        return Response([{
            'id':       e.id,
            'nom':      e.nom,
            'ville':    e.ville,
            'pays':     e.pays,
            'nb_users': User.objects.filter(ecole=e.nom).count(),
        } for e in ecoles])
    nom = request.data.get('nom', '').strip()
    if not nom:
        return Response({'error': 'Nom requis'}, status=400)
    ecole, created = Ecole.objects.get_or_create(
        nom=nom,
        defaults={'ville': request.data.get('ville', ''), 'pays': request.data.get('pays', 'France')}
    )
    if not created:
        return Response({'error': 'Cette école existe déjà'}, status=400)
    return Response({'id': ecole.id, 'nom': ecole.nom}, status=201)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_ecole_detail(request, ecole_id):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        ecole = Ecole.objects.get(pk=ecole_id)
        ecole.active = False
        ecole.save()
        return Response({'message': f'École "{ecole.nom}" désactivée'})
    except Ecole.DoesNotExist:
        return Response({'error': 'École introuvable'}, status=404)


# ─── ADMIN FILIÈRES ──────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_filieres(request):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    if request.method == 'GET':
        filieres = Filiere.objects.all().order_by('ordre')
        return Response([{
            'id':       f.id,
            'code':     f.code,
            'label':    f.label,
            'icone':    f.icone,
            'active':   f.active,
            'ordre':    f.ordre,
            'nb_users': sum(1 for u in User.objects.all() if f.code in (u.filieres or [])),
        } for f in filieres])
    code  = request.data.get('code', '').strip().lower().replace(' ', '_')
    label = request.data.get('label', '').strip()
    if not code or not label:
        return Response({'error': 'Code et label requis'}, status=400)
    if Filiere.objects.filter(code=code).exists():
        return Response({'error': 'Ce code filière existe déjà'}, status=400)
    f = Filiere.objects.create(
        code=code, label=label,
        icone=request.data.get('icone', '🎓'),
        ordre=request.data.get('ordre', 99)
    )
    return Response({'id': f.id, 'code': f.code, 'label': f.label}, status=201)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_filiere_detail(request, filiere_id):
    if not is_admin_or_formateur(request.user):
        return Response({'error': 'Accès refusé'}, status=403)
    try:
        f = Filiere.objects.get(pk=filiere_id)
    except Filiere.DoesNotExist:
        return Response({'error': 'Filière introuvable'}, status=404)
    if request.method == 'PUT':
        f.label  = request.data.get('label', f.label)
        f.icone  = request.data.get('icone', f.icone)
        f.active = request.data.get('active', f.active)
        f.ordre  = request.data.get('ordre', f.ordre)
        f.save()
        return Response({'id': f.id, 'code': f.code, 'label': f.label})
    f.active = False
    f.save()
    return Response({'message': f'Filière "{f.label}" désactivée'})