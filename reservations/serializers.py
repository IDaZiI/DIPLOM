from rest_framework import serializers
from .models import RestaurantTable, Reservation


class RestaurantTableSerializer(serializers.ModelSerializer):
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
            raise serializers.ValidationError("Table width and height must be greater than 0.")

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
    class Meta:
        model = Reservation
        fields = '__all__'

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        guest_count = attrs.get('guest_count')
        table = attrs.get('table')
        reservation_date = attrs.get('reservation_date')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be earlier than end time.")

        if table and guest_count and guest_count > table.capacity:
            raise serializers.ValidationError("Guest count exceeds table capacity.")

        if table and reservation_date and start_time and end_time:
            overlapping_reservations = Reservation.objects.filter(
                table=table,
                reservation_date=reservation_date,
                status__in=['pending', 'confirmed'],
                start_time__lt=end_time,
                end_time__gt=start_time,
            )

            if self.instance:
                overlapping_reservations = overlapping_reservations.exclude(pk=self.instance.pk)

            if overlapping_reservations.exists():
                raise serializers.ValidationError("This table is already reserved for the selected time.")

        return attrs