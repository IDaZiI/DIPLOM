from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, EmployeeAvailability, ConfirmedShift


admin.site.register(User, UserAdmin)
admin.site.register(EmployeeAvailability)

@admin.register(ConfirmedShift)
class ConfirmedShiftAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'employee',
        'date',
        'start_time',
        'end_time',
        'zone',
        'is_manual',
        'assigned_at',
    )
    list_filter = (
        'date',
        'zone',
        'is_manual',
    )
    search_fields = (
        'employee__username',
        'employee__first_name',
        'employee__last_name',
        'employee__email',
        'note',
    )