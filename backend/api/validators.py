"""
Service de validation des quêtes.
Chaque type de quête a sa propre logique de validation.
"""
import requests
from django.utils import timezone


GITHUB_HEADERS = {'Accept': 'application/vnd.github.v3+json'}
TIMEOUT = 8


def valider_quete(user_quete, soumission):
    """
    Point d'entrée principal.
    Retourne (succes: bool, feedback: str, points: int)
    """
    quete = user_quete.quete
    config = quete.validation_config or {}
    t = quete.type_quete

    if t == 'github_repo':
        return _valider_github_repo(user_quete.user, soumission, config, quete.points)

    elif t == 'github_commit':
        return _valider_github_commits(user_quete.user, soumission, config, quete.points)

    elif t == 'github_file':
        return _valider_github_fichier(user_quete.user, soumission, config, quete.points)

    elif t == 'quiz':
        return _valider_quiz(soumission, config, quete.points)

    elif t == 'url_submit':
        return _valider_url(soumission, config, quete.points)

    elif t == 'admin_review':
        # Mise en attente — l'admin valide manuellement
        return None, "✋ Votre soumission a été envoyée. Un formateur va la vérifier.", 0

    return False, "Type de quête inconnu", 0


# ─── GITHUB : REPO EXISTANT ───────────────────────────────
def _valider_github_repo(user, soumission, config, points):
    """
    Vérifie qu'un repo GitHub existe sur le compte du user.
    soumission = nom du repo ou URL complète
    config = {"repo_name_contains": "portfolio"} (optionnel)
    """
    github_user = user.github_username
    if not github_user:
        return False, "❌ Vous devez d'abord connecter votre compte GitHub dans votre profil.", 0

    # Extraire le nom du repo depuis l'URL ou le nom direct
    repo_name = soumission.strip()
    if 'github.com' in repo_name:
        # ex: https://github.com/user/mon-repo
        parts = repo_name.rstrip('/').split('/')
        repo_name = parts[-1]

    try:
        url = f"https://api.github.com/repos/{github_user}/{repo_name}"
        r = requests.get(url, headers=GITHUB_HEADERS, timeout=TIMEOUT)

        if r.status_code == 404:
            return False, f"❌ Le repo '{repo_name}' n'existe pas sur votre compte GitHub ({github_user}).", 0

        if r.status_code != 200:
            return False, "❌ Impossible de contacter GitHub. Réessayez.", 0

        repo = r.json()

        # Vérification optionnelle du nom
        keyword = config.get('repo_name_contains', '')
        if keyword and keyword.lower() not in repo['name'].lower():
            return False, f"❌ Le repo doit contenir '{keyword}' dans son nom.", 0

        # Vérification description non vide (bonne pratique)
        if not repo.get('description'):
            return False, f"❌ Votre repo existe mais n'a pas de description. Ajoutez-en une sur GitHub puis resoumettez.", 0

        return True, f"✅ Repo '{repo['name']}' vérifié ! {repo.get('description', '')}", points

    except requests.Timeout:
        return False, "❌ GitHub ne répond pas. Réessayez dans quelques secondes.", 0
    except Exception as e:
        return False, f"❌ Erreur de vérification : {str(e)}", 0


# ─── GITHUB : NOMBRE DE COMMITS ───────────────────────────
def _valider_github_commits(user, soumission, config, points):
    """
    Vérifie qu'un repo a un nombre minimum de commits.
    soumission = nom du repo
    config = {"min_commits": 5}
    """
    github_user = user.github_username
    if not github_user:
        return False, "❌ Connectez d'abord votre GitHub dans votre profil.", 0

    repo_name = soumission.strip()
    if 'github.com' in repo_name:
        repo_name = repo_name.rstrip('/').split('/')[-1]

    min_commits = int(config.get('min_commits', 3))

    try:
        url = f"https://api.github.com/repos/{github_user}/{repo_name}/commits?per_page=100"
        r = requests.get(url, headers=GITHUB_HEADERS, timeout=TIMEOUT)

        if r.status_code == 404:
            return False, f"❌ Repo '{repo_name}' introuvable sur votre GitHub.", 0

        commits = r.json()
        nb = len(commits) if isinstance(commits, list) else 0

        if nb < min_commits:
            return False, f"❌ Votre repo a {nb} commit(s) mais il en faut au minimum {min_commits}. Continuez à travailler !", 0

        # Points proportionnels au nombre de commits (bonus si beaucoup)
        bonus = min(50, (nb - min_commits) * 5)
        total = points + bonus
        msg = f"✅ {nb} commits détectés sur '{repo_name}' !"
        if bonus > 0:
            msg += f" Bonus +{bonus} XP pour votre activité !"
        return True, msg, total

    except Exception as e:
        return False, f"❌ Erreur : {str(e)}", 0


# ─── GITHUB : FICHIER REQUIS DANS LE REPO ─────────────────
def _valider_github_fichier(user, soumission, config, points):
    """
    Vérifie que des fichiers spécifiques existent dans un repo.
    soumission = nom du repo
    config = {"required_files": ["README.md", "Dockerfile", "docker-compose.yml"]}
    """
    github_user = user.github_username
    if not github_user:
        return False, "❌ Connectez d'abord votre GitHub dans votre profil.", 0

    repo_name = soumission.strip()
    if 'github.com' in repo_name:
        repo_name = repo_name.rstrip('/').split('/')[-1]

    required_files = config.get('required_files', ['README.md'])

    try:
        url = f"https://api.github.com/repos/{github_user}/{repo_name}/contents/"
        r = requests.get(url, headers=GITHUB_HEADERS, timeout=TIMEOUT)

        if r.status_code == 404:
            return False, f"❌ Repo '{repo_name}' introuvable.", 0

        contents = r.json()
        if not isinstance(contents, list):
            return False, "❌ Impossible de lire le contenu du repo.", 0

        existing_files = [f['name'] for f in contents]
        missing = [f for f in required_files if f not in existing_files]

        if missing:
            return False, f"❌ Fichiers manquants dans votre repo : {', '.join(missing)}. Ajoutez-les et resoumettez.", 0

        return True, f"✅ Tous les fichiers requis trouvés dans '{repo_name}' : {', '.join(required_files)}", points

    except Exception as e:
        return False, f"❌ Erreur : {str(e)}", 0


# ─── QUIZ TECHNIQUE ───────────────────────────────────────
def _valider_quiz(soumission, config, points):
    """
    Vérifie la réponse à une question technique.
    soumission = lettre de la réponse (ex: "b")
    config = {"answer": "b", "explanation": "..."}
    """
    bonne_reponse = config.get('answer', '').strip().lower()
    reponse_user = soumission.strip().lower()

    if reponse_user == bonne_reponse:
        explication = config.get('explanation', '')
        return True, f"✅ Bonne réponse ! {explication}", points

    # Points partiels si mauvaise réponse ? Non, 0 points
    tentatives_max = config.get('max_attempts', 3)
    return False, f"❌ Mauvaise réponse. Relisez la documentation et réessayez !", 0


# ─── URL SUBMISSION ───────────────────────────────────────
def _valider_url(soumission, config, points):
    """
    Vérifie qu'une URL est accessible et correspond au pattern attendu.
    soumission = URL
    config = {"url_must_contain": "github.com", "check_accessible": true}
    """
    url = soumission.strip()

    if not url.startswith(('http://', 'https://')):
        return False, "❌ L'URL doit commencer par http:// ou https://", 0

    # Vérifier pattern requis
    pattern = config.get('url_must_contain', '')
    if pattern and pattern.lower() not in url.lower():
        return False, f"❌ L'URL doit contenir '{pattern}'.", 0

    # Vérifier que l'URL est accessible
    if config.get('check_accessible', False):
        try:
            r = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
            if r.status_code >= 400:
                return False, f"❌ L'URL retourne une erreur {r.status_code}. Vérifiez que votre site est bien en ligne.", 0
        except Exception:
            return False, "❌ L'URL n'est pas accessible. Vérifiez que votre site est bien déployé.", 0

    return True, f"✅ URL validée : {url}", points
