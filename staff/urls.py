from django.urls import path
from .views import (
    RegisterView,
    EmployeeAvailabilityListCreateView,
    EmployeeAvailabilityDetailView,
    CurrentUserView,
    AdminAvailabilityListView,
    WaiterListView,
    WaiterDetailView,
    MyConfirmedShiftListView,
    AdminConfirmedShiftListCreateView,
    AdminConfirmedShiftDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('availabilities/', EmployeeAvailabilityListCreateView.as_view(), name='availability-list-create'),
    path('availabilities/<int:pk>/', EmployeeAvailabilityDetailView.as_view(), name='availability-detail'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('admin/availabilities/', AdminAvailabilityListView.as_view(), name='admin-availability-list'),
    path('admin/waiters/', WaiterListView.as_view(), name='admin-waiter-list'),
    path('admin/waiters/<int:pk>/', WaiterDetailView.as_view(), name='admin-waiter-detail'),
    path('confirmed-shifts/', MyConfirmedShiftListView.as_view(), name='my-confirmed-shifts'),
    path('admin/confirmed-shifts/',AdminConfirmedShiftListCreateView.as_view(), name='admin-confirmed-shifts'),
    path('admin/confirmed-shifts/<int:pk>/', AdminConfirmedShiftDetailView.as_view(), name='admin-confirmed-shift-detail'),
]