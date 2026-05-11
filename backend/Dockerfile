# FROM python:3.11-slim

# WORKDIR /app

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# # ✅ Collectstatic au build
# RUN python manage.py collectstatic --noinput

# EXPOSE 8000

# # ✅ Au démarrage : migrate + fixtures + superuser auto + gunicorn
# CMD ["sh", "-c", "\
#   python manage.py migrate --noinput && \
#   python manage.py loaddata api/fixtures/filieres.json || true && \
#   python manage.py loaddata api/fixtures/initial_data.json || true && \
#   python manage.py create_default_superuser || true && \
#   gunicorn careerquest.wsgi:application --bind 0.0.0.0:8000 --workers 2 \
# "]

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["sh", "-c", "\
  echo '=== MIGRATE ===' && \
  python manage.py migrate --noinput && \
  echo '=== FILIERES ===' && \
  python manage.py loaddata api/fixtures/filieres.json && \
  echo '=== QUETES ===' && \
  python manage.py loaddata api/fixtures/initial_data.json || true && \
  echo '=== SUPERUSER ===' && \
  python manage.py shell -c \"\
from api.models import User; \
u,created = User.objects.get_or_create(username='admin', defaults={'email':'admin@careerquest.com','is_staff':True,'is_superuser':True}); \
u.set_password('Admin1234!'); \
u.is_staff=True; u.is_superuser=True; \
u.save(); \
print('Superuser OK:', u.username, '| created:', created) \
\" && \
  echo '=== GUNICORN ===' && \
  gunicorn careerquest.wsgi:application --bind 0.0.0.0:8000 --workers 2 \
"]