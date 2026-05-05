from datetime import date, time, timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from staff.models import User
from .models import RestaurantTable, Reservation, BookingSettings


class ReservationAPITests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='adminpass123',
            role='admin'
        )

        self.client_user = User.objects.create_user(
            username='client',
            password='clientpass123',
            role='client'
        )

        self.waiter_user = User.objects.create_user(
            username='waiter',
            password='waiterpass123',
            role='waiter'
        )

        self.booking_settings, _ = BookingSettings.objects.get_or_create(
            pk=1,
            defaults={
                'online_booking_enabled': True,
                'booking_start_time': time(10, 0),
                'booking_end_time': time(22, 0),
                'reservation_duration_minutes': 120,
                'min_time_before_booking_minutes': 0,
                'max_days_ahead': 30,
                'online_booking_percent': 100,
                'reserved_for_walkin_count': 0,
            }
        )

        self.booking_settings.online_booking_enabled = True
        self.booking_settings.booking_start_time = time(10, 0)
        self.booking_settings.booking_end_time = time(22, 0)
        self.booking_settings.reservation_duration_minutes = 120
        self.booking_settings.min_time_before_booking_minutes = 0
        self.booking_settings.max_days_ahead = 30
        self.booking_settings.online_booking_percent = 100
        self.booking_settings.reserved_for_walkin_count = 0
        self.booking_settings.save()

        self.future_date = timezone.localdate() + timedelta(days=5)

        self.table = RestaurantTable.objects.create(
            number=1,
            capacity=4,
            shape='round',
            x=100,
            y=120,
            width=80,
            height=80,
            zone='main',
            is_active=True
        )

        self.tables_url = reverse('table-list-create')
        self.available_tables_url = reverse('available-tables')
        self.reservation_create_url = reverse('reservation-create')
        self.admin_reservations_url = reverse('reservation-list')

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_admin_can_create_table(self):
        self.authenticate(self.admin_user)

        data = {
            'number': 2,
            'capacity': 6,
            'shape': 'rect',
            'x': 250,
            'y': 250,
            'width': 100,
            'height': 80,
            'zone': 'vip',
            'is_active': True
        }

        response = self.client.post(self.tables_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RestaurantTable.objects.count(), 2)
        self.assertEqual(RestaurantTable.objects.get(number=2).capacity, 6)

    def test_non_admin_cannot_create_table(self):
        self.authenticate(self.waiter_user)

        data = {
            'number': 2,
            'capacity': 6,
            'shape': 'rect',
            'x': 250,
            'y': 250,
            'width': 100,
            'height': 80,
            'zone': 'vip',
            'is_active': True
        }

        response = self.client.post(self.tables_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(RestaurantTable.objects.count(), 1)

    def test_client_can_create_reservation_without_end_time(self):
        data = {
            'table': self.table.id,
            'client_name': 'Ivan Ivanov',
            'client_phone': '+79999999999',
            'client_email': 'ivan@example.com',
            'guest_count': 2,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '18:00:00',
            'comment': 'Near the window',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 1)

        reservation = Reservation.objects.first()

        self.assertEqual(reservation.client_name, 'Ivan Ivanov')
        self.assertEqual(reservation.start_time, time(18, 0))
        self.assertEqual(reservation.end_time, time(20, 0))
        self.assertEqual(reservation.status, 'active')

    def test_client_cannot_create_reservation_when_online_booking_disabled(self):
        self.booking_settings.online_booking_enabled = False
        self.booking_settings.save()

        data = {
            'table': self.table.id,
            'client_name': 'Ivan Ivanov',
            'client_phone': '+79999999999',
            'client_email': 'ivan@example.com',
            'guest_count': 2,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '18:00:00',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reservation.objects.count(), 0)

    def test_client_cannot_create_reservation_outside_booking_interval(self):
        data = {
            'table': self.table.id,
            'client_name': 'Ivan Ivanov',
            'client_phone': '+79999999999',
            'client_email': 'ivan@example.com',
            'guest_count': 2,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '21:30:00',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reservation.objects.count(), 0)

    def test_client_cannot_create_reservation_too_far_ahead(self):
        too_far_date = timezone.localdate() + timedelta(days=60)

        data = {
            'table': self.table.id,
            'client_name': 'Ivan Ivanov',
            'client_phone': '+79999999999',
            'client_email': 'ivan@example.com',
            'guest_count': 2,
            'reservation_date': too_far_date.isoformat(),
            'start_time': '18:00:00',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reservation.objects.count(), 0)

    def test_cannot_create_reservation_if_guest_count_exceeds_capacity(self):
        data = {
            'table': self.table.id,
            'client_name': 'Big Company',
            'client_phone': '+79990000000',
            'client_email': 'big@example.com',
            'guest_count': 6,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '18:00:00',
            'comment': '',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reservation.objects.count(), 0)

    def test_cannot_create_overlapping_reservation(self):
        Reservation.objects.create(
            table=self.table,
            client_name='First Client',
            client_phone='+79991111111',
            client_email='first@example.com',
            guest_count=2,
            reservation_date=self.future_date,
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='active'
        )

        data = {
            'table': self.table.id,
            'client_name': 'Second Client',
            'client_phone': '+79992222222',
            'client_email': 'second@example.com',
            'guest_count': 2,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '19:00:00',
            'comment': 'Overlap attempt',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Reservation.objects.count(), 1)

    def test_can_create_reservation_without_overlap(self):
        Reservation.objects.create(
            table=self.table,
            client_name='First Client',
            client_phone='+79991111111',
            client_email='first@example.com',
            guest_count=2,
            reservation_date=self.future_date,
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='active'
        )

        data = {
            'table': self.table.id,
            'client_name': 'Second Client',
            'client_phone': '+79992222222',
            'client_email': 'second@example.com',
            'guest_count': 2,
            'reservation_date': self.future_date.isoformat(),
            'start_time': '20:00:00',
            'comment': 'No overlap',
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 2)

    def test_available_tables_returns_free_tables_only(self):
        second_table = RestaurantTable.objects.create(
            number=2,
            capacity=4,
            shape='rect',
            x=300,
            y=300,
            width=80,
            height=80,
            zone='main',
            is_active=True
        )

        Reservation.objects.create(
            table=self.table,
            client_name='Busy Client',
            client_phone='+79993333333',
            client_email='busy@example.com',
            guest_count=2,
            reservation_date=self.future_date,
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='active'
        )

        response = self.client.get(
            self.available_tables_url,
            {
                'date': self.future_date.isoformat(),
                'start_time': '18:30:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = [table['id'] for table in response.data]

        self.assertIn(second_table.id, returned_ids)
        self.assertNotIn(self.table.id, returned_ids)

    def test_available_tables_returns_400_when_online_booking_disabled(self):
        self.booking_settings.online_booking_enabled = False
        self.booking_settings.save()

        response = self.client.get(
            self.available_tables_url,
            {
                'date': self.future_date.isoformat(),
                'start_time': '18:00:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_available_tables_returns_400_outside_booking_interval(self):
        response = self.client.get(
            self.available_tables_url,
            {
                'date': self.future_date.isoformat(),
                'start_time': '21:30:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_available_tables_returns_400_too_far_ahead(self):
        too_far_date = timezone.localdate() + timedelta(days=60)

        response = self.client.get(
            self.available_tables_url,
            {
                'date': too_far_date.isoformat(),
                'start_time': '18:00:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_available_tables_respects_online_percent_and_walkin_reserve(self):
        RestaurantTable.objects.create(
            number=2,
            capacity=4,
            shape='rect',
            x=300,
            y=300,
            width=80,
            height=80,
            zone='main',
            is_active=True
        )

        RestaurantTable.objects.create(
            number=3,
            capacity=4,
            shape='rect',
            x=500,
            y=300,
            width=80,
            height=80,
            zone='main',
            is_active=True
        )

        self.booking_settings.online_booking_percent = 50
        self.booking_settings.reserved_for_walkin_count = 1
        self.booking_settings.save()

        response = self.client.get(
            self.available_tables_url,
            {
                'date': self.future_date.isoformat(),
                'start_time': '18:00:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Всего 3 активных столика.
        # 50% = 1 столик.
        # Резерв живой посадки: 3 - 1 = 2.
        # min(1, 2) = 1 столик доступен онлайн.
        self.assertEqual(len(response.data), 1)

    def test_can_create_non_overlapping_table(self):
        self.authenticate(self.admin_user)

        data = {
            'number': 2,
            'capacity': 4,
            'shape': 'rect',
            'x': 250,
            'y': 250,
            'width': 80,
            'height': 80,
            'zone': 'main',
            'is_active': True
        }

        response = self.client.post(self.tables_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RestaurantTable.objects.count(), 2)

    def test_cannot_create_overlapping_table(self):
        self.authenticate(self.admin_user)

        data = {
            'number': 2,
            'capacity': 4,
            'shape': 'rect',
            'x': 120,
            'y': 140,
            'width': 80,
            'height': 80,
            'zone': 'main',
            'is_active': True
        }

        response = self.client.post(self.tables_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(RestaurantTable.objects.count(), 1)
        self.assertIn('non_field_errors', response.data)

    def test_cannot_update_table_to_overlapping_position(self):
        self.authenticate(self.admin_user)

        second_table = RestaurantTable.objects.create(
            number=2,
            capacity=4,
            shape='rect',
            x=300,
            y=300,
            width=80,
            height=80,
            zone='main',
            is_active=True
        )

        url = reverse('table-detail', args=[second_table.id])

        data = {
            'x': 110,
            'y': 130
        }

        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

        second_table.refresh_from_db()
        self.assertEqual(second_table.x, 300)
        self.assertEqual(second_table.y, 300)