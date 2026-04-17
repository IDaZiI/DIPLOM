from django.urls import path
from .views import EmployeeAvailabilityListCreateView

urlpatterns = [
    path('availabilities/', EmployeeAvailabilityListCreateView.as_view(), name='availability-list-create'),
]