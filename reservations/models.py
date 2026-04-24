from django.db import models


class TableFeature(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class RestaurantTable(models.Model):
    SHAPE_CHOICES = [
        ('round', 'Round'),
        ('square', 'Square'),
        ('rect', 'Rectangle'),
    ]

    ZONE_CHOICES = [
        ('main', 'Main Hall'),
        ('terrace', 'Terrace'),
        ('vip', 'VIP'),
    ]

    number = models.PositiveIntegerField(unique=True)
    capacity = models.PositiveIntegerField()
    shape = models.CharField(max_length=20, choices=SHAPE_CHOICES, default='square')

    x = models.PositiveIntegerField(default=0)
    y = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=80)
    height = models.PositiveIntegerField(default=80)

    zone = models.CharField(max_length=20, choices=ZONE_CHOICES, default='main')
    is_active = models.BooleanField(default=True)

    features = models.ManyToManyField(
        TableFeature,
        related_name='tables',
        blank=True
    )

    def __str__(self):
        return f"Table {self.number} ({self.capacity} seats)"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    table = models.ForeignKey(
        RestaurantTable,
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    client_name = models.CharField(max_length=100)
    client_phone = models.CharField(max_length=20)
    client_email = models.EmailField(blank=True, null=True)

    guest_count = models.PositiveIntegerField()
    reservation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['reservation_date', 'start_time']

    def __str__(self):
        return f"{self.client_name} - Table {self.table.number} on {self.reservation_date}"