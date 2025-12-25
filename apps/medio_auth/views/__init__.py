# apps/medio_auth/views/__init__.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from ..serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    UserUpdateSerializer
)

User = get_user_model()


# ============================================
# VISTAS EXISTENTES DE AUTENTICACIÓN
# ============================================

class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            # Generar token de verificación y enviar email
            email_sent = False
            try:
                verification_token = user.generate_verification_token()
                verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
                
                send_mail(
                    subject='¡Bienvenido a MéDico1! - Verifica tu email',
                    message=f'''
¡Hola {user.first_name or user.username}!

¡Bienvenido a MéDico1! Estamos encantados de tenerte con nosotros.

Para activar todas las funciones de tu cuenta, verifica tu email:

{verification_url}

Este enlace expirará en 24 horas.

Saludos,
El equipo de MéDico1
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
                email_sent = True
            except Exception as e:
                print(f"Error enviando email de verificación: {e}")
            
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'email_verification_sent': email_sent
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            user_data = UserSerializer(user).data
            
            return Response({
                'message': 'Login exitoso',
                'user': user_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Logout exitoso'},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            
            return Response({
                'access': str(token.access_token),
            }, status=status.HTTP_200_OK)
        except TokenError:
            return Response(
                {'error': 'Token inválido o expirado'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=False,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            user_data = UserSerializer(request.user).data
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': user_data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            user_data = UserSerializer(request.user).data
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': user_data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Contraseña cambiada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# NUEVAS VISTAS DE VERIFICACIÓN DE EMAIL
# ============================================

class SendVerificationEmailView(APIView):
    """
    Envía email de verificación a un usuario por su email.
    Público - no requiere autenticación.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe
            return Response(
                {'message': 'Si el email existe, se enviará un código de verificación'}, 
                status=status.HTTP_200_OK
            )
        
        if user.is_email_verified:
            return Response(
                {'message': 'Este email ya está verificado'}, 
                status=status.HTTP_200_OK
            )
        
        # Limitar reenvíos (no más de 1 cada 5 minutos)
        if user.email_verification_sent_at:
            time_since_last = timezone.now() - user.email_verification_sent_at
            if time_since_last < timedelta(minutes=5):
                minutes_left = 5 - (time_since_last.seconds // 60)
                return Response(
                    {'error': f'Debes esperar {minutes_left} minutos antes de solicitar otro email'}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        # Generar token y enviar email
        try:
            token = user.generate_verification_token()
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            
            send_mail(
                subject='Verifica tu email - MéDico1',
                message=f'Hola {user.first_name or user.username}! Verifica tu email: {verification_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Email de verificación enviado correctamente',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error enviando email: {e}")
            return Response(
                {'error': 'Error al enviar el email de verificación'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyEmailView(APIView):
    """
    Verifica el email usando el token.
    Público - no requiere autenticación.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Token es requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response(
                {'error': 'Token inválido o expirado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.is_email_verified:
            return Response(
                {'message': 'Este email ya ha sido verificado previamente'}, 
                status=status.HTTP_200_OK
            )
        
        # Verificar expiración (24 horas)
        if user.email_verification_sent_at:
            expiration_time = user.email_verification_sent_at + timedelta(hours=24)
            if timezone.now() > expiration_time:
                return Response(
                    {'error': 'El token ha expirado. Solicita uno nuevo.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verificar email
        user.is_email_verified = True
        user.clear_verification_token()
        
        return Response({
            'message': 'Email verificado correctamente',
            'email': user.email,
            'username': user.username
        }, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    """
    Reenvía el email de verificación al usuario autenticado.
    Requiere autenticación JWT.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        if user.is_email_verified:
            return Response(
                {'message': 'Tu email ya está verificado'}, 
                status=status.HTTP_200_OK
            )
        
        # Limitar reenvíos
        if user.email_verification_sent_at:
            time_since_last = timezone.now() - user.email_verification_sent_at
            if time_since_last < timedelta(minutes=5):
                minutes_left = 5 - (time_since_last.seconds // 60)
                return Response(
                    {'error': f'Debes esperar {minutes_left} minutos antes de solicitar otro email'}, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
        
        try:
            token = user.generate_verification_token()
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            
            send_mail(
                subject='Verifica tu email - MéDico1',
                message=f'Hola {user.first_name or user.username}! Aquí está tu nuevo enlace: {verification_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Email de verificación reenviado correctamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Error enviando email: {e}")
            return Response(
                {'error': 'Error al enviar el email'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckVerificationStatusView(APIView):
    """
    Verifica el estado de verificación del email del usuario.
    Requiere autenticación JWT.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        can_resend = True
        if user.email_verification_sent_at:
            time_since_last = timezone.now() - user.email_verification_sent_at
            can_resend = time_since_last >= timedelta(minutes=5)
        
        return Response({
            'is_email_verified': user.is_email_verified,
            'email': user.email,
            'username': user.username,
            'can_resend': can_resend
        }, status=status.HTTP_200_OK)