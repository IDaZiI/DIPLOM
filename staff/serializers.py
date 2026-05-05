from rest_framework import serializers
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import EmployeeAvailability, User, ConfirmedShift

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
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'is_active']

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
        selected_date = data.get('date', getattr(self.instance, 'date', None))

        if selected_date < timezone.localdate():
            raise serializers.ValidationError({
                'date': 'Нельзя указывать доступность на прошедшую дату.'
            })

        if end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала.'
            })

        employee = self.context['request'].user

        overlapping = EmployeeAvailability.objects.filter(
            employee=employee,
            date=selected_date,
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
    

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data
    
class AdminWaiterCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'password2',
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                'Пользователь с таким логином уже существует.'
            )

        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'Пользователь с таким email уже существует.'
            )

        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                'password': 'Пароли не совпадают.'
            })

        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User(
            **validated_data,
            role='waiter'
        )
        user.set_password(password)
        user.save()

        return user
    
class AdminWaiterUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'is_active',
        ]
        read_only_fields = [
            'id',
            'username',
            'role',
        ]

    def validate_email(self, value):
        if value and User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError(
                'Пользователь с таким email уже существует.'
            )

        return value
    
    def validate(self, attrs):
        if self.instance and self.instance.role != 'waiter':
            raise serializers.ValidationError(
                'Можно изменять только учётные записи официантов.'
            )

        return attrs
    

class ConfirmedShiftSerializer(serializers.ModelSerializer):
    employee_username = serializers.CharField(source='employee.username', read_only=True)
    employee_full_name = serializers.SerializerMethodField()
    zone_display = serializers.CharField(source='get_zone_display', read_only=True)
    duration_hours = serializers.SerializerMethodField()

    class Meta:
        model = ConfirmedShift
        fields = [
            'id',
            'employee',
            'availability',
            'employee_username',
            'employee_full_name',
            'date',
            'start_time',
            'end_time',
            'zone',
            'zone_display',
            'actual_start_time',
            'actual_end_time',
            'is_manual',
            'note',
            'assigned_at',
            'duration_hours',
        ]
        read_only_fields = [
            'id',
            'employee_username',
            'employee_full_name',
            'zone_display',
            'assigned_at',
            'duration_hours',
        ]

    def get_employee_full_name(self, obj):
        full_name = f'{obj.employee.first_name} {obj.employee.last_name}'.strip()
        return full_name or obj.employee.username

    def get_duration_hours(self, obj):
        start_minutes = obj.start_time.hour * 60 + obj.start_time.minute
        end_minutes = obj.end_time.hour * 60 + obj.end_time.minute

        duration_minutes = max(0, end_minutes - start_minutes)

        return round(duration_minutes / 60, 2)

    def validate(self, attrs):
        employee = attrs.get(
            'employee',
            self.instance.employee if self.instance else None
        )
        availability = attrs.get(
            'availability',
            self.instance.availability if self.instance else None
        )
        date = attrs.get(
            'date',
            self.instance.date if self.instance else None
        )
        start_time = attrs.get(
            'start_time',
            self.instance.start_time if self.instance else None
        )
        end_time = attrs.get(
            'end_time',
            self.instance.end_time if self.instance else None
        )
        actual_start_time = attrs.get(
            'actual_start_time',
            self.instance.actual_start_time if self.instance else None
        )
        actual_end_time = attrs.get(
            'actual_end_time',
            self.instance.actual_end_time if self.instance else None
        )

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала.'
            })

        if (
            actual_start_time
            and actual_end_time
            and actual_end_time <= actual_start_time
        ):
            raise serializers.ValidationError({
                'actual_end_time': 'Фактическое окончание должно быть позже фактического начала.'
            })

        if availability:
            if employee and availability.employee_id != employee.id:
                raise serializers.ValidationError(
                    'Подтверждённая смена должна относиться к тому же сотруднику, что и интервал доступности.'
                )

            if date and availability.date != date:
                raise serializers.ValidationError(
                    'Дата смены должна совпадать с датой интервала доступности.'
                )

            if (
                start_time
                and end_time
                and (
                    start_time < availability.start_time
                    or end_time > availability.end_time
                )
            ):
                raise serializers.ValidationError(
                    'Подтверждённая смена должна находиться внутри интервала доступности сотрудника.'
                )

        return attrs