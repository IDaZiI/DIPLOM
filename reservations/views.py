from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError

from .services import (
    get_booking_settings,
    parse_booking_date,
    parse_booking_time,
    validate_online_booking_rules,
    get_busy_tables_for_interval,
    get_remaining_online_slots,
)

from .models import RestaurantTable, Reservation, TableFeature, BookingSettings, HallScheme
from .serializers import (
    RestaurantTableSerializer,
    ReservationSerializer,
    TableFeatureSerializer,
    BookingSettingsSerializer,
    HallSchemeSerializer,
    ClientReservationSerializer,
)
from .permissions import IsAdminUserRole

class TableFeatureListView(generics.ListCreateAPIView):
    queryset = TableFeature.objects.all()
    serializer_class = TableFeatureSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [AllowAny()]


class TableFeatureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TableFeature.objects.all()
    serializer_class = TableFeatureSerializer
    permission_classes = [IsAdminUserRole]


class TableListCreateView(generics.ListCreateAPIView):
    queryset = RestaurantTable.objects.all().order_by('number')
    serializer_class = RestaurantTableSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUserRole()]
        return [IsAuthenticated()]


class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = RestaurantTable.objects.all()
    serializer_class = RestaurantTableSerializer
    permission_classes = [IsAdminUserRole]

    def perform_destroy(self, instance):
        has_active_reservations = instance.reservations.filter(status='active').exists()

        if has_active_reservations:
            raise ValidationError(
                'Нельзя удалить столик, для которого существуют активные бронирования.'
            )

        instance.delete()

class AvailableTablesView(generics.ListAPIView):
    serializer_class = RestaurantTableSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        date_param = self.request.query_params.get('date')
        start_time_param = self.request.query_params.get('start_time')
        guest_count = self.request.query_params.get('guest_count')
        feature_id = self.request.query_params.get('feature')

        settings_obj = get_booking_settings()

        reservation_date = parse_booking_date(date_param)
        start_time = parse_booking_time(start_time_param)

        try:
            end_time = validate_online_booking_rules(
                reservation_date,
                start_time,
                settings_obj,
            )
        except serializers.ValidationError as exc:
            raise ValidationError(exc.detail)

        queryset = RestaurantTable.objects.filter(is_active=True)

        if guest_count:
            queryset = queryset.filter(capacity__gte=int(guest_count))

        if feature_id:
            queryset = queryset.filter(features__id=feature_id)

        busy_tables = get_busy_tables_for_interval(
            reservation_date,
            start_time,
            end_time,
        ).values_list('table_id', flat=True)

        queryset = queryset.exclude(id__in=busy_tables)

        queryset = queryset.distinct().order_by('number')

        remaining_online_slots = get_remaining_online_slots(
            reservation_date,
            start_time,
            end_time,
        )

        if remaining_online_slots <= 0:
            return queryset.none()

        return queryset[:remaining_online_slots]

class ReservationCreateView(generics.CreateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ClientReservationSerializer
    permission_classes = [AllowAny]

class ReservationListView(generics.ListCreateAPIView):
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        queryset = Reservation.objects.all().order_by(
            'reservation_date',
            'start_time'
        )

        status = self.request.query_params.get('status')
        date = self.request.query_params.get('date')
        table = self.request.query_params.get('table')

        if status:
            queryset = queryset.filter(status=status)

        if date:
            queryset = queryset.filter(reservation_date=date)

        if table:
            queryset = queryset.filter(table_id=table)

        return queryset


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUserRole]

class BookingSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSettingsSerializer
    permission_classes = [IsAdminUserRole]

    def get_object(self):
        settings_obj, _ = BookingSettings.objects.get_or_create(
            pk=1,
            defaults={
                'online_booking_enabled': True,
                'online_booking_percent': 100,
                'reserved_for_walkin_count': 0,
            }
        )
        return settings_obj
    

class ClientReservationLookupView(APIView):
    permission_classes = []

    def post(self, request):
        booking_code = request.data.get('booking_code')
        client_phone = request.data.get('client_phone')

        if not booking_code or not client_phone:
            return Response(
                {'detail': 'Укажите номер бронирования и номер телефона.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reservation = Reservation.objects.get(
                booking_code=booking_code,
                client_phone=client_phone
            )
        except Reservation.DoesNotExist:
            return Response(
                {'detail': 'Бронирование с указанными данными не найдено.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)


class ClientReservationCancelView(APIView):
    permission_classes = []

    def post(self, request):
        booking_code = request.data.get('booking_code')
        client_phone = request.data.get('client_phone')

        if not booking_code or not client_phone:
            return Response(
                {'detail': 'Укажите номер бронирования и номер телефона.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reservation = Reservation.objects.get(
                booking_code=booking_code,
                client_phone=client_phone
            )
        except Reservation.DoesNotExist:
            return Response(
                {'detail': 'Бронирование с указанными данными не найдено.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if reservation.status == 'cancelled':
            return Response(
                {'detail': 'Это бронирование уже отменено.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.status = 'cancelled'
        reservation.save(update_fields=['status'])

        serializer = ReservationSerializer(reservation)
        return Response(serializer.data)
    
class HallSchemeView(generics.RetrieveUpdateAPIView):
    serializer_class = HallSchemeSerializer
    permission_classes = [IsAdminUserRole]

    def get_object(self):
        obj, created = HallScheme.objects.get_or_create(pk=1)
        return obj

    def delete(self, request, *args, **kwargs):
        obj = self.get_object()

        if obj.image:
            obj.image.delete(save=False)

        obj.image = None
        obj.save(update_fields=['image', 'updated_at'])

        return Response(
            {'detail': 'Схема зала удалена.'},
            status=status.HTTP_200_OK
        )
    
class PublicHallSchemeView(generics.RetrieveAPIView):
    serializer_class = HallSchemeSerializer
    permission_classes = []

    def get_object(self):
        obj, created = HallScheme.objects.get_or_create(pk=1)
        return obj