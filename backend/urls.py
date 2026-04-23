from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from staff.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/', include('staff.urls')),
    path('api/', include('reservations.urls')),

    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]