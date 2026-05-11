FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ✅ Collectstatic au build
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# ✅ Au démarrage : migrate + fixtures + superuser auto + gunicorn
CMD ["sh", "-c", "\
  python manage.py migrate --noinput && \
  python manage.py loaddata api/fixtures/filieres.json || true && \
  python manage.py loaddata api/fixtures/initial_data.json || true && \
  python manage.py create_default_superuser || true && \
  gunicorn careerquest.wsgi:application --bind 0.0.0.0:8000 --workers 2 \
"]