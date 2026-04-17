from django.contrib.auth.models import AbstractUser
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

    def __str__(self):
        return f"{self.employee.username} - {self.date} {self.start_time}-{self.end_time}"