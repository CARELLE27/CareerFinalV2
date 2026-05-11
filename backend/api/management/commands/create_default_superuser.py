# backend/api/management/commands/create_default_superuser.py
# Crée automatiquement un superuser si aucun n'existe

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Crée un superuser par défaut si aucun existe'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin1234!')
        email    = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@careerquest.com')

        if not User.objects.filter(is_superuser=True).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
            )
            self.stdout.write(f'✅ Superuser "{username}" créé !')
        else:
            self.stdout.write('ℹ️  Superuser déjà existant — skip.')