from rest_framework import serializers
from .models import EmployeeAvailability, User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Пароли не совпадают.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']

class EmployeeAvailabilitySerializer(serializers.ModelSerializer):
    employee = serializers.StringRelatedField(read_only=True)
    employee_id = serializers.IntegerField(source='employee.id', read_only=True)
    employee_username = serializers.CharField(source='employee.username', read_only=True)

    class Meta:
        model = EmployeeAvailability
        fields = [
            'id',
            'employee',
            'employee_id',
            'employee_username',
            'date',
            'start_time',
            'end_time',
            'comment',
            'created_at'
        ]
        read_only_fields = ['id', 'employee', 'employee_id', 'employee_username', 'created_at']

    def validate(self, data):
        start_time = data.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = data.get('end_time', getattr(self.instance, 'end_time', None))
        date = data.get('date', getattr(self.instance, 'date', None))

        if end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала.'
            })

        employee = self.context['request'].user

        overlapping = EmployeeAvailability.objects.filter(
            employee=employee,
            date=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if self.instance:
            overlapping = overlapping.exclude(pk=self.instance.pk)

        if overlapping.exists():
            raise serializers.ValidationError(
                'У вас уже есть пересекающийся интервал доступности на эту дату.'
            )

        return data