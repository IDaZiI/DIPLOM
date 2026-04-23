from django.contrib import admin
from .models import RestaurantTable, Reservation


@admin.register(RestaurantTable)
class RestaurantTableAdmin(admin.ModelAdmin):
    list_display = ('number', 'capacity', 'shape', 'zone', 'is_active')
    list_filter = ('shape', 'zone', 'is_active')
    search_fields = ('number',)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'client_name',
        'table',
        'guest_count',
        'reservation_date',
        'start_time',
        'end_time',
        'status',
    )
    list_filter = ('status', 'reservation_date')
    search_fields = ('client_name', 'client_phone', 'client_email')