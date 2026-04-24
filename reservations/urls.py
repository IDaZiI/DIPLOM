from django.urls import path
from .views import (
    TableListCreateView,
    TableDetailView,
    AvailableTablesView,
    ReservationCreateView,
    ReservationListView,
    ReservationDetailView,
    TableFeatureListView,
    TableFeatureDetailView,
)

urlpatterns = [
    path('tables/', TableListCreateView.as_view(), name='table-list-create'),
    path('tables/<int:pk>/', TableDetailView.as_view(), name='table-detail'),
    path('tables/available/', AvailableTablesView.as_view(), name='available-tables'),

    path('table-features/', TableFeatureListView.as_view(), name='table-feature-list'),
    path('table-features/<int:pk>/', TableFeatureDetailView.as_view(), name='table-feature-detail'),

    path('reservations/', ReservationCreateView.as_view(), name='reservation-create'),
    path('admin/reservations/', ReservationListView.as_view(), name='reservation-list'),
    path('admin/reservations/<int:pk>/', ReservationDetailView.as_view(), name='reservation-detail'),
]