from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User, EmployeeAvailability


class AuthenticationTests(APITestCase):
    def test_user_registration(self):
        url = reverse('register')
        data = {
            'username': 'waiter_test',
            'first_name': 'Ivan',
            'last_name': 'Petrov',
            'email': 'waiter_test@example.com',
            'role': 'waiter',
            'password': 'testpassword123',
            'password2': 'testpassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().username, 'waiter_test')

    def test_jwt_token_obtain(self):
        User.objects.create_user(
            username='waiter_token',
            password='testpassword123',
            role='waiter'
        )

        url = reverse('token_obtain_pair')
        data = {
            'username': 'waiter_token',
            'password': 'testpassword123'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)


class EmployeeAvailabilityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='waiter1',
            password='testpassword123',
            role='waiter'
        )

        token_url = reverse('token_obtain_pair')
        token_response = self.client.post(token_url, {
            'username': 'waiter1',
            'password': 'testpassword123'
        }, format='json')

        self.access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_create_availability(self):
        url = reverse('availability-list-create')
        data = {
            'date': '2026-04-21',
            'start_time': '10:00:00',
            'end_time': '14:00:00',
            'comment': 'Test availability'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EmployeeAvailability.objects.count(), 1)
        availability = EmployeeAvailability.objects.first()
        self.assertEqual(availability.employee, self.user)
        self.assertEqual(str(availability.date), '2026-04-21')

    def test_create_overlapping_availability_should_fail(self):
        EmployeeAvailability.objects.create(
            employee=self.user,
            date='2026-04-21',
            start_time='10:00:00',
            end_time='14:00:00',
            comment='Existing interval'
        )

        url = reverse('availability-list-create')
        data = {
            'date': '2026-04-21',
            'start_time': '13:00:00',
            'end_time': '16:00:00',
            'comment': 'Overlapping interval'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(EmployeeAvailability.objects.count(), 1)


class AdminEndpointTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin1',
            password='testpassword123',
            role='admin'
        )
        self.waiter_user = User.objects.create_user(
            username='waiter2',
            password='testpassword123',
            role='waiter'
        )

        EmployeeAvailability.objects.create(
            employee=self.waiter_user,
            date='2026-04-22',
            start_time='09:00:00',
            end_time='13:00:00',
            comment='Morning shift'
        )

    def test_admin_can_view_waiters(self):
        token_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'admin1',
            'password': 'testpassword123'
        }, format='json')

        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(reverse('admin-waiter-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['username'], 'waiter2')

    def test_admin_can_view_all_availabilities(self):
        token_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'admin1',
            'password': 'testpassword123'
        }, format='json')

        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(reverse('admin-availability-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['employee_username'], 'waiter2')

    def test_waiter_cannot_access_admin_waiters_endpoint(self):
        token_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'waiter2',
            'password': 'testpassword123'
        }, format='json')

        access_token = token_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.get(reverse('admin-waiter-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)