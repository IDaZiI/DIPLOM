from django.utils.text import slugify
from rest_framework import serializers
from django.utils import timezone
from .models import RestaurantTable, Reservation, TableFeature, BookingSettings, HallScheme
from .services import (
    get_booking_settings,
    validate_online_booking_rules,
    get_remaining_online_slots,
    is_reservation_finished,
)

MAX_TABLE_CAPACITY = 20

def transliterate_ru(text):
    mapping = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
        'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
        'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
        'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
        'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',
    }

    text = text.lower().strip()
    result = ''.join(mapping.get(char, char) for char in text)
    return slugify(result) or 'feature'

class TableFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableFeature
        fields = ['id', 'name', 'slug']
        read_only_fields = ['slug']

    def validate_name(self, value):
        queryset = TableFeature.objects.filter(name__iexact=value.strip())

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                'Характеристика с таким названием уже существует.'
            )

        return value.strip()

    def create(self, validated_data):
        name = validated_data['name']
        base_slug = transliterate_ru(name)
        slug = base_slug
        counter = 1

        while TableFeature.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        validated_data['slug'] = slug
        return super().create(validated_data)

    def update(self, instance, validated_data):
        name = validated_data.get('name', instance.name).strip()

        if name != instance.name:
            base_slug = transliterate_ru(name)
            slug = base_slug
            counter = 1

            while TableFeature.objects.filter(slug=slug).exclude(pk=instance.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1

            validated_data['slug'] = slug

        return super().update(instance, validated_data)

class RestaurantTableSerializer(serializers.ModelSerializer):
    features = serializers.PrimaryKeyRelatedField(
        queryset=TableFeature.objects.all(),
        many=True,
        required=False
    )
    features_details = TableFeatureSerializer(
        source='features',
        many=True,
        read_only=True
    )

    class Meta:
        model = RestaurantTable
        fields = '__all__'

    def validate(self, attrs):
        instance = self.instance

        x = attrs.get('x', instance.x if instance else 0)
        y = attrs.get('y', instance.y if instance else 0)
        width = attrs.get('width', instance.width if instance else 80)
        height = attrs.get('height', instance.height if instance else 80)
        capacity = attrs.get('capacity', instance.capacity if instance else None)

        if capacity is None:
            raise serializers.ValidationError(
                'Укажите вместимость столика.'
            )

        if capacity < 1:
            raise serializers.ValidationError(
                'Вместимость столика должна быть не меньше 1 места.'
            )

        if capacity > MAX_TABLE_CAPACITY:
            raise serializers.ValidationError(
                f'Вместимость одного столика не может превышать {MAX_TABLE_CAPACITY} мест.'
            )

        if width <= 0 or height <= 0:
            raise serializers.ValidationError(
                "Table width and height must be greater than 0."
            )

        current_left = x
        current_right = x + width
        current_top = y
        current_bottom = y + height

        overlapping_tables = RestaurantTable.objects.all()

        if instance:
            overlapping_tables = overlapping_tables.exclude(pk=instance.pk)

        for table in overlapping_tables:
            table_left = table.x
            table_right = table.x + table.width
            table_top = table.y
            table_bottom = table.y + table.height

            no_overlap = (
                current_right <= table_left
                or current_left >= table_right
                or current_bottom <= table_top
                or current_top >= table_bottom
            )

            if not no_overlap:
                raise serializers.ValidationError(
                    f"Столик пересекается с уже существующим столиком №{table.number}."
                )

        return attrs

class ReservationSerializer(serializers.ModelSerializer):
    table_details = RestaurantTableSerializer(source='table', read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'

    def validate(self, attrs):
        instance = self.instance

        start_time = attrs.get(
            'start_time',
            instance.start_time if instance else None
        )
        end_time = attrs.get(
            'end_time',
            instance.end_time if instance else None
        )
        guest_count = attrs.get(
            'guest_count',
            instance.guest_count if instance else None
        )
        table = attrs.get(
            'table',
            instance.table if instance else None
        )
        reservation_date = attrs.get(
            'reservation_date',
            instance.reservation_date if instance else None
        )
        status = attrs.get(
            'status',
            instance.status if instance else 'active'
        )

        old_status = instance.status if instance else None

        if instance and old_status == 'cancelled' and status == 'cancelled':
            raise serializers.ValidationError(
                'Это бронирование уже отменено.'
            )

        if instance and status == 'cancelled' and is_reservation_finished(instance):
            raise serializers.ValidationError(
                'Нельзя отменить завершённое бронирование.'
            )

        if reservation_date and reservation_date < timezone.localdate():
            raise serializers.ValidationError(
                'Нельзя создать или восстановить бронирование на прошедшую дату.'
            )

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                'Время начала должно быть раньше времени окончания.'
            )

        if table and guest_count and guest_count > table.capacity:
            raise serializers.ValidationError(
                'Количество гостей превышает вместимость выбранного столика.'
            )

        if (
            status == 'active'
            and table
            and reservation_date
            and start_time
            and end_time
        ):
            overlapping_reservations = Reservation.objects.filter(
                table=table,
                reservation_date=reservation_date,
                status='active',
                start_time__lt=end_time,
                end_time__gt=start_time,
            )

            if instance:
                overlapping_reservations = overlapping_reservations.exclude(
                    pk=instance.pk
                )

            if overlapping_reservations.exists():
                raise serializers.ValidationError(
                    'Выбранный столик уже занят в указанный временной интервал.'
                )

        return attrs

class ClientReservationSerializer(ReservationSerializer):
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = [
            'status',
            'end_time',
            'booking_code',
            'created_at',
        ]
        extra_kwargs = {
            'end_time': {'required': False},
        }

    def validate(self, attrs):
        settings_obj = get_booking_settings()

        reservation_date = attrs.get('reservation_date')
        start_time = attrs.get('start_time')
        table = attrs.get('table')
        guest_count = attrs.get('guest_count')

        if not reservation_date:
            raise serializers.ValidationError('Укажите дату бронирования.')

        if not start_time:
            raise serializers.ValidationError('Укажите время начала бронирования.')

        end_time = validate_online_booking_rules(
            reservation_date,
            start_time,
            settings_obj,
        )

        attrs['end_time'] = end_time
        attrs['status'] = 'active'

        if table and guest_count and guest_count > table.capacity:
            raise serializers.ValidationError(
                'Количество гостей превышает вместимость выбранного столика.'
            )

        if table:
            overlapping_reservations = Reservation.objects.filter(
                table=table,
                reservation_date=reservation_date,
                status='active',
                start_time__lt=end_time,
                end_time__gt=start_time,
            )

            if overlapping_reservations.exists():
                raise serializers.ValidationError(
                    'Выбранный столик уже занят в указанный временной интервал.'
                )

        remaining_online_slots = get_remaining_online_slots(
            reservation_date,
            start_time,
            end_time,
        )

        if remaining_online_slots <= 0:
            raise serializers.ValidationError(
                'На выбранное время нет доступных столиков для онлайн-бронирования.'
            )

        return attrs

class BookingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSettings
        fields = '__all__'

    def validate(self, attrs):
        booking_start_time = attrs.get(
            'booking_start_time',
            self.instance.booking_start_time if self.instance else None
        )
        booking_end_time = attrs.get(
            'booking_end_time',
            self.instance.booking_end_time if self.instance else None
        )
        reservation_duration_minutes = attrs.get(
            'reservation_duration_minutes',
            self.instance.reservation_duration_minutes if self.instance else None
        )
        min_time_before_booking_minutes = attrs.get(
            'min_time_before_booking_minutes',
            self.instance.min_time_before_booking_minutes if self.instance else None
        )
        max_days_ahead = attrs.get(
            'max_days_ahead',
            self.instance.max_days_ahead if self.instance else None
        )
        online_booking_percent = attrs.get(
            'online_booking_percent',
            self.instance.online_booking_percent if self.instance else None
        )
        reserved_for_walkin_count = attrs.get(
            'reserved_for_walkin_count',
            self.instance.reserved_for_walkin_count if self.instance else None
        )

        if booking_start_time and booking_end_time and booking_start_time >= booking_end_time:
            raise serializers.ValidationError(
                'Время начала бронирования должно быть раньше времени окончания.'
            )

        if reservation_duration_minutes is not None and reservation_duration_minutes <= 0:
            raise serializers.ValidationError(
                'Длительность бронирования должна быть больше 0 минут.'
            )

        if min_time_before_booking_minutes is not None and min_time_before_booking_minutes < 0:
            raise serializers.ValidationError(
                'Минимальное время до начала бронирования не может быть отрицательным.'
            )

        if max_days_ahead is not None and max_days_ahead <= 0:
            raise serializers.ValidationError(
                'Максимальный период предварительного бронирования должен быть больше 0 дней.'
            )

        if online_booking_percent is not None and not 0 <= online_booking_percent <= 100:
            raise serializers.ValidationError(
                'Доля столиков для онлайн-бронирования должна быть от 0 до 100.'
            )

        if reserved_for_walkin_count is not None and reserved_for_walkin_count < 0:
            raise serializers.ValidationError(
                'Количество столиков для живой посадки не может быть отрицательным.'
            )

        return attrs

class HallSchemeSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HallScheme
        fields = [
            'id',
            'image',
            'image_url',
            'updated_at',
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')

        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)

        if obj.image:
            return obj.image.url

        return None