from datetime import datetime, time, timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time
from rest_framework import serializers

from .models import BookingSettings, Reservation, RestaurantTable


def get_booking_settings():
    settings_obj, _ = BookingSettings.objects.get_or_create(
        pk=1,
        defaults={
            'online_booking_enabled': True,
            'booking_start_time': time(10, 0),
            'booking_end_time': time(22, 0),
            'reservation_duration_minutes': 120,
            'min_time_before_booking_minutes': 60,
            'max_days_ahead': 30,
            'online_booking_percent': 100,
            'reserved_for_walkin_count': 0,
        }
    )

    return settings_obj


def parse_booking_date(value):
    if not value:
        raise serializers.ValidationError('Укажите дату бронирования.')

    parsed_date = parse_date(str(value))

    if not parsed_date:
        raise serializers.ValidationError('Некорректный формат даты бронирования.')

    return parsed_date


def parse_booking_time(value):
    if not value:
        raise serializers.ValidationError('Укажите время начала бронирования.')

    parsed_time = parse_time(str(value))

    if not parsed_time:
        raise serializers.ValidationError('Некорректный формат времени бронирования.')

    return parsed_time


def calculate_end_time(start_time, settings_obj):
    start_datetime = datetime.combine(timezone.localdate(), start_time)
    end_datetime = start_datetime + timedelta(
        minutes=settings_obj.reservation_duration_minutes
    )

    return end_datetime.time()


def validate_online_booking_rules(reservation_date, start_time, settings_obj):
    if not settings_obj.online_booking_enabled:
        raise serializers.ValidationError(
            'Онлайн-бронирование сейчас отключено.'
        )

    today = timezone.localdate()

    if reservation_date < today:
        raise serializers.ValidationError(
            'Нельзя создать бронирование на прошедшую дату.'
        )

    max_date = today + timedelta(days=settings_obj.max_days_ahead)

    if reservation_date > max_date:
        raise serializers.ValidationError(
            f'Бронирование доступно максимум на {settings_obj.max_days_ahead} дней вперёд.'
        )

    end_time = calculate_end_time(start_time, settings_obj)

    if start_time < settings_obj.booking_start_time:
        raise serializers.ValidationError(
            'Выбранное время раньше разрешённого интервала бронирования.'
        )

    if end_time > settings_obj.booking_end_time:
        raise serializers.ValidationError(
            'Бронирование выходит за пределы разрешённого интервала.'
        )

    reservation_datetime = timezone.make_aware(
        datetime.combine(reservation_date, start_time),
        timezone.get_current_timezone()
    )

    min_allowed_datetime = timezone.now() + timedelta(
        minutes=settings_obj.min_time_before_booking_minutes
    )

    if reservation_datetime < min_allowed_datetime:
        raise serializers.ValidationError(
            f'Бронирование можно создать минимум за '
            f'{settings_obj.min_time_before_booking_minutes} минут до начала.'
        )

    return end_time


def get_allowed_online_tables_count():
    settings_obj = get_booking_settings()

    total_active_tables = RestaurantTable.objects.filter(is_active=True).count()

    if total_active_tables == 0:
        return 0

    percent_limit = (
        total_active_tables * settings_obj.online_booking_percent
    ) // 100

    reserve_limit = total_active_tables - settings_obj.reserved_for_walkin_count

    allowed_online_tables = min(percent_limit, reserve_limit)

    return max(0, allowed_online_tables)


def get_busy_tables_for_interval(reservation_date, start_time, end_time):
    return Reservation.objects.filter(
        reservation_date=reservation_date,
        status='active',
        start_time__lt=end_time,
        end_time__gt=start_time,
    )


def get_remaining_online_slots(reservation_date, start_time, end_time):
    allowed_online_tables = get_allowed_online_tables_count()

    if allowed_online_tables <= 0:
        return 0

    busy_count = get_busy_tables_for_interval(
        reservation_date,
        start_time,
        end_time,
    ).count()

    return max(0, allowed_online_tables - busy_count)

def is_reservation_finished(reservation):
    reservation_end_datetime = timezone.make_aware(
        datetime.combine(
            reservation.reservation_date,
            reservation.end_time
        ),
        timezone.get_current_timezone()
    )

    return reservation_end_datetime < timezone.now()