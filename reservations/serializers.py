from django.utils.text import slugify
from rest_framework import serializers
from django.utils import timezone
from .models import RestaurantTable, Reservation, TableFeature, BookingSettings

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
    
class BookingSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSettings
        fields = '__all__'

    def validate_online_booking_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('Процент онлайн-бронирования должен быть от 0 до 100.')
        return value