from rest_framework.permissions import BasePermission


class IsWaiter(BasePermission):
    message = 'Только официант может работать с данными о своей доступности.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'waiter'


class IsAdminUserRole(BasePermission):
    message = 'Доступ разрешён только администратору.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'