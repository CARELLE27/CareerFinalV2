from django.contrib import admin
from .models import User, Competence, UserCompetence, Quete, UserQuete

@admin.register(UserQuete)
class UserQueteAdmin(admin.ModelAdmin):
    list_display  = ['user', 'quete', 'statut', 'points_gagnes', 'date_soumission']
    list_filter   = ['statut', 'quete']
    search_fields = ['user__username', 'quete__titre']
    actions       = ['valider_selection', 'refuser_selection']

    def valider_selection(self, request, queryset):
        for uq in queryset.filter(statut='soumis'):
            uq.statut = 'valide'
            uq.points_gagnes = uq.quete.points
            uq.save()
            uq.user.points += uq.quete.points
            uq.user.save()
        self.message_user(request, "Quêtes validées avec succès.")
    valider_selection.short_description = "✅ Valider les soumissions sélectionnées"

    def refuser_selection(self, request, queryset):
        queryset.filter(statut='soumis').update(statut='refuse')
        self.message_user(request, "Quêtes refusées.")
    refuser_selection.short_description = "❌ Refuser les soumissions sélectionnées"

admin.site.register(User)
admin.site.register(Competence)
admin.site.register(UserCompetence)
admin.site.register(Quete)
