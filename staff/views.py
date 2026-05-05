from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .serializers import CustomTokenObtainPairSerializer
from .models import EmployeeAvailability, User, ConfirmedShift
from .serializers import (
    EmployeeAvailabilitySerializer,
    UserSerializer,
    RegisterSerializer,
    AdminWaiterCreateSerializer,
    AdminWaiterUpdateSerializer,
    ConfirmedShiftSerializer,
)
from .permissions import IsWaiter, IsAdminUserRole


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class EmployeeAvailabilityListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsWaiter]

    def get_queryset(self):
        return EmployeeAvailability.objects.filter(employee=self.request.user).order_by('date', 'start_time')

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

class EmployeeAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EmployeeAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsWaiter]

    def get_queryset(self):
        return EmployeeAvailability.objects.filter(employee=self.request.user)

    def _validate_can_change(self):
        availability = self.get_object()

        if availability.date < timezone.localdate():
            raise ValidationError(
                'Нельзя редактировать или удалять интервалы доступности за прошедшие даты.'
            )

        if availability.confirmed_shifts.exists():
            raise ValidationError(
                'Нельзя редактировать или удалять доступность, по которой уже назначена подтверждённая смена.'
            )

        return availability

    def update(self, request, *args, **kwargs):
        self._validate_can_change()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._validate_can_change()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._validate_can_change()
        return super().destroy(request, *args, **kwargs)

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AdminAvailabilityListView(generics.ListAPIView):
    serializer_class = EmployeeAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = EmployeeAvailability.objects.all().order_by('date', 'start_time')

        employee_id = self.request.query_params.get('employee')
        date = self.request.query_params.get('date')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if date:
            queryset = queryset.filter(date=date)

        return queryset


class WaiterListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        return User.objects.filter(role='waiter').order_by('username')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminWaiterCreateSerializer

        return UserSerializer
    
class WaiterDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]
    serializer_class = AdminWaiterUpdateSerializer

    def get_queryset(self):
        return User.objects.filter(role='waiter')
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MyConfirmedShiftListView(generics.ListAPIView):
    serializer_class = ConfirmedShiftSerializer
    permission_classes = [permissions.IsAuthenticated, IsWaiter]

    def get_queryset(self):
        return ConfirmedShift.objects.filter(
            employee=self.request.user
        ).order_by('date', 'start_time')


class AdminConfirmedShiftListCreateView(generics.ListCreateAPIView):
    serializer_class = ConfirmedShiftSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = ConfirmedShift.objects.all().order_by('date', 'start_time')

        employee_id = self.request.query_params.get('employee')
        date = self.request.query_params.get('date')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        if date:
            queryset = queryset.filter(date=date)

        return queryset


class AdminConfirmedShiftDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ConfirmedShift.objects.all()
    serializer_class = ConfirmedShiftSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]