# apps/medio_auth/urls.py

from django.urls import path
from .views import (
    # Vistas existentes
    RegisterView,
    LoginView,
    LogoutView,
    RefreshTokenView,
    UserProfileView,
    ChangePasswordView,
    
    # Nuevas vistas de verificación de email
    SendVerificationEmailView,
    VerifyEmailView,
    ResendVerificationEmailView,
    CheckVerificationStatusView,
)

app_name = 'medio_auth'

urlpatterns = [
    # ============================================
    # RUTAS EXISTENTES DE AUTENTICACIÓN
    # ============================================
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('me/', UserProfileView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    
    # ============================================
    # NUEVAS RUTAS DE VERIFICACIÓN DE EMAIL
    # ============================================
    # Enviar email de verificación (público)
    path('send-verification/', SendVerificationEmailView.as_view(), name='send_verification_email'),
    
    # Verificar email con token (público)
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Reenviar email de verificación (requiere autenticación)
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification_email'),
    
    # Verificar estado de verificación (requiere autenticación)
    path('verification-status/', CheckVerificationStatusView.as_view(), name='check_verification_status'),
]