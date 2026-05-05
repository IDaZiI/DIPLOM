from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('waiter', 'Waiter'),
        ('client', 'Client'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='waiter'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


class EmployeeAvailability(models.Model):
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='availabilities'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала.'
            })

        overlapping = EmployeeAvailability.objects.filter(
            employee=self.employee,
            date=self.date,
            start_time__lt=self.end_time,
            end_time__gt=self.start_time
        )

        if self.pk:
            overlapping = overlapping.exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError(
                'У сотрудника уже есть пересекающийся интервал доступности на эту дату.'
            )

    def __str__(self):
        return f"{self.employee.username} - {self.date} {self.start_time}-{self.end_time}"



class ConfirmedShift(models.Model):
    ZONE_CHOICES = [
        ('main', 'Основной зал'),
        ('terrace', 'Терраса'),
        ('vip', 'VIP-зона'),
        ('bar', 'Бар'),
        ('kitchen', 'Кухня'),
        ('other', 'Другая зона'),
    ]

    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='confirmed_shifts',
        verbose_name='Сотрудник'
    )

    availability = models.ForeignKey(
        EmployeeAvailability,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_shifts',
        verbose_name='Интервал доступности'
    )

    date = models.DateField(verbose_name='Дата смены')
    start_time = models.TimeField(verbose_name='Начало смены')
    end_time = models.TimeField(verbose_name='Окончание смены')

    zone = models.CharField(
        max_length=30,
        choices=ZONE_CHOICES,
        default='main',
        verbose_name='Зона работы'
    )

    actual_start_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Фактическое начало'
    )

    actual_end_time = models.TimeField(
        null=True,
        blank=True,
        verbose_name='Фактическое окончание'
    )

    is_manual = models.BooleanField(
        default=True,
        verbose_name='Назначено вручную'
    )

    note = models.TextField(
        blank=True,
        null=True,
        verbose_name='Комментарий'
    )

    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата назначения'
    )

    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = 'Подтверждённая смена'
        verbose_name_plural = 'Подтверждённые смены'

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError({
                'end_time': 'Время окончания должно быть позже времени начала.'
            })

        if (
            self.actual_start_time
            and self.actual_end_time
            and self.actual_end_time <= self.actual_start_time
        ):
            raise ValidationError({
                'actual_end_time': 'Фактическое окончание должно быть позже фактического начала.'
            })

        if self.availability:
            if self.availability.employee_id != self.employee_id:
                raise ValidationError(
                    'Подтверждённая смена должна относиться к тому же сотруднику, что и интервал доступности.'
                )

            if self.date != self.availability.date:
                raise ValidationError(
                    'Дата смены должна совпадать с датой интервала доступности.'
                )

            if (
                self.start_time < self.availability.start_time
                or self.end_time > self.availability.end_time
            ):
                raise ValidationError(
                    'Подтверждённая смена должна находиться внутри интервала доступности сотрудника.'
                )

    def __str__(self):
        return f'{self.employee.username} — {self.date} {self.start_time}-{self.end_time}'