from rest_framework import serializers
from .models import EmployeeAvailability


class EmployeeAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeAvailability
        fields = '__all__'