from rest_framework import generics
from .models import EmployeeAvailability
from .serializers import EmployeeAvailabilitySerializer


class EmployeeAvailabilityListCreateView(generics.ListCreateAPIView):
    queryset = EmployeeAvailability.objects.all()
    serializer_class = EmployeeAvailabilitySerializer