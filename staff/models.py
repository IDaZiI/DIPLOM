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