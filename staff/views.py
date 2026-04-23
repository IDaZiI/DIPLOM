from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .models import EmployeeAvailability, User
from .serializers import EmployeeAvailabilitySerializer, UserSerializer, RegisterSerializer
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


class WaiterListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        return User.objects.filter(role='waiter').order_by('username')
    
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer