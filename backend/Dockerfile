# FROM python:3.11-slim

# WORKDIR /app

# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# EXPOSE 8000

# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ✅ Fichiers statiques
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# ✅ Gunicorn pour la production
CMD ["gunicorn", "careerquest.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2"]