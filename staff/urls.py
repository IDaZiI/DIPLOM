from django.urls import path
from .views import (
    RegisterView,
    EmployeeAvailabilityListCreateView,
    EmployeeAvailabilityDetailView,
    CurrentUserView,
    AdminAvailabilityListView,
    WaiterListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('availabilities/', EmployeeAvailabilityListCreateView.as_view(), name='availability-list-create'),
    path('availabilities/<int:pk>/', EmployeeAvailabilityDetailView.as_view(), name='availability-detail'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('admin/availabilities/', AdminAvailabilityListView.as_view(), name='admin-availability-list'),
    path('admin/waiters/', WaiterListView.as_view(), name='admin-waiter-list'),
]