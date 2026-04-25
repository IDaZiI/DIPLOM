from django.contrib import admin
from .models import RestaurantTable, Reservation, TableFeature, BookingSettings


@admin.register(TableFeature)
class TableFeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')


@admin.register(RestaurantTable)
class RestaurantTableAdmin(admin.ModelAdmin):
    list_display = ('number', 'capacity', 'shape', 'zone', 'is_active')
    list_filter = ('shape', 'zone', 'is_active', 'features')
    search_fields = ('number',)
    filter_horizontal = ('features',)


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

@admin.register(BookingSettings)
class BookingSettingsAdmin(admin.ModelAdmin):
    list_display = ('online_booking_enabled', 'online_booking_percent', 'reserved_for_walkin_count', 'updated_at')