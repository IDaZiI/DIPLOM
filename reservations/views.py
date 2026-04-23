from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import RestaurantTable, Reservation
from .serializers import RestaurantTableSerializer, ReservationSerializer
from .permissions import IsAdminUserRole


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


class AvailableTablesView(generics.ListAPIView):
    serializer_class = RestaurantTableSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        date = self.request.query_params.get('date')
        start_time = self.request.query_params.get('start_time')
        end_time = self.request.query_params.get('end_time')
        guest_count = self.request.query_params.get('guest_count')

        queryset = RestaurantTable.objects.filter(is_active=True)

        if guest_count:
            queryset = queryset.filter(capacity__gte=guest_count)

        if date and start_time and end_time:
            busy_tables = Reservation.objects.filter(
                reservation_date=date,
                status__in=['pending', 'confirmed'],
                start_time__lt=end_time,
                end_time__gt=start_time,
            ).values_list('table_id', flat=True)

            queryset = queryset.exclude(id__in=busy_tables)

        return queryset.order_by('number')


class ReservationCreateView(generics.CreateAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [AllowAny]


class ReservationListView(generics.ListAPIView):
    queryset = Reservation.objects.all().order_by('reservation_date', 'start_time')
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUserRole]


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUserRole]