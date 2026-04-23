from datetime import date, time

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from staff.models import User
from .models import RestaurantTable, Reservation


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
            'x': 200,
            'y': 150,
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
            'x': 200,
            'y': 150,
            'width': 100,
            'height': 80,
            'zone': 'vip',
            'is_active': True
        }

        response = self.client.post(self.tables_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(RestaurantTable.objects.count(), 1)

    def test_create_reservation_success(self):
        data = {
            'table': self.table.id,
            'client_name': 'Ivan Ivanov',
            'client_phone': '+79999999999',
            'client_email': 'ivan@example.com',
            'guest_count': 2,
            'reservation_date': '2026-04-24',
            'start_time': '18:00:00',
            'end_time': '20:00:00',
            'comment': 'Near the window',
            'status': 'pending'
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 1)
        self.assertEqual(Reservation.objects.first().client_name, 'Ivan Ivanov')

    def test_cannot_create_reservation_if_guest_count_exceeds_capacity(self):
        data = {
            'table': self.table.id,
            'client_name': 'Big Company',
            'client_phone': '+79990000000',
            'client_email': 'big@example.com',
            'guest_count': 6,
            'reservation_date': '2026-04-24',
            'start_time': '18:00:00',
            'end_time': '20:00:00',
            'comment': '',
            'status': 'pending'
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
            reservation_date=date(2026, 4, 24),
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='pending'
        )

        data = {
            'table': self.table.id,
            'client_name': 'Second Client',
            'client_phone': '+79992222222',
            'client_email': 'second@example.com',
            'guest_count': 2,
            'reservation_date': '2026-04-24',
            'start_time': '19:00:00',
            'end_time': '21:00:00',
            'comment': 'Overlap attempt',
            'status': 'pending'
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
            reservation_date=date(2026, 4, 24),
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='pending'
        )

        data = {
            'table': self.table.id,
            'client_name': 'Second Client',
            'client_phone': '+79992222222',
            'client_email': 'second@example.com',
            'guest_count': 2,
            'reservation_date': '2026-04-24',
            'start_time': '20:00:00',
            'end_time': '22:00:00',
            'comment': 'No overlap',
            'status': 'pending'
        }

        response = self.client.post(self.reservation_create_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.count(), 2)

    def test_available_tables_returns_free_tables_only(self):
        second_table = RestaurantTable.objects.create(
            number=2,
            capacity=4,
            shape='square',
            x=220,
            y=140,
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
            reservation_date=date(2026, 4, 24),
            start_time=time(18, 0),
            end_time=time(20, 0),
            comment='',
            status='confirmed'
        )

        response = self.client.get(
            self.available_tables_url,
            {
                'date': '2026-04-24',
                'start_time': '18:30:00',
                'end_time': '19:30:00',
                'guest_count': 2
            }
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [table['id'] for table in response.data]

        self.assertIn(second_table.id, returned_ids)
        self.assertNotIn(self.table.id, returned_ids)


    def test_can_create_non_overlapping_table(self):
        self.authenticate(self.admin_user)

        data = {
            'number': 2,
            'capacity': 4,
            'shape': 'square',
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
            'shape': 'square',
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
            shape='square',
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
