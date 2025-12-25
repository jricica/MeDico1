# apps/medio_auth/models/__init__.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import secrets


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado para MeDico
    Extiende AbstractUser con campos específicos para profesionales médicos
    """
    # ROL DEL USUARIO
    ROLE_CHOICES = [
        (0, 'Admin'),
        (1, 'User'),
    ]
    
    role = models.IntegerField(
        choices=ROLE_CHOICES,
        default=1,
        verbose_name="Rol",
        help_text="Rol del usuario en el sistema (0=Admin, 1=User)"
    )
    
    # Información de contacto
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name="Teléfono",
        help_text="Número de teléfono del doctor"
    )
    
    # Información profesional
    specialty = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Especialidad",
        help_text="Especialidad médica (ej: Cardiología, Ortopedia)"
    )
    
    license_number = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        unique=True,
        verbose_name="Número de Colegiado",
        help_text="Número de licencia médica o colegiado"
    )
    
    hospital_default = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name="Hospital Principal",
        help_text="Hospital donde trabaja principalmente"
    )
    
    # Archivos del usuario
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name="Foto de Perfil",
        help_text="Imagen de avatar del usuario"
    )
    
    signature_image = models.ImageField(
        upload_to='signatures/',
        blank=True,
        null=True,
        verbose_name="Firma Digital",
        help_text="Imagen de la firma del doctor para documentos"
    )
    
    # Plan de Suscripción
    PLAN_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
    ]
    
    plan = models.CharField(
        max_length=10,
        choices=PLAN_CHOICES,
        default='bronze',
        verbose_name="Plan de Suscripción",
        help_text="Plan actual del usuario"
    )
    
    # Verificación de Email - CAMPOS NUEVOS
    is_email_verified = models.BooleanField(
        default=False,
        verbose_name="Email Verificado",
        help_text="Indica si el email del usuario ha sido verificado"
    )
    
    email_verification_token = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Token de Verificación de Email",
        help_text="Token único para verificar el email del usuario"
    )
    
    email_verification_sent_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Fecha de Envío del Token",
        help_text="Fecha y hora en que se envió el último token de verificación"
    )
    
    # Verificación general (mantener para compatibilidad)
    is_verified = models.BooleanField(
        default=False,
        verbose_name="Cuenta Verificada por Admin",
        help_text="Indica si la cuenta ha sido verificada por un administrador"
    )
    
    # Configuraciones personales
    theme_preference = models.CharField(
        max_length=20,
        choices=[
            ('light', 'Claro'),
            ('dark', 'Oscuro'),
            ('system', 'Sistema')
        ],
        default='system',
        verbose_name="Tema Preferido"
    )
    
    # Metadatos
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Registro"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última Actualización"
    )
    
    # Email obligatorio y único
    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        help_text="Dirección de correo electrónico"
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['license_number']),
            models.Index(fields=['created_at']),
            models.Index(fields=['email_verification_token']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} - {self.specialty or 'Sin especialidad'}"
    
    def get_full_name(self):
        """Devuelve el nombre completo del usuario"""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
    
    def generate_verification_token(self):
        """
        Genera un token único para verificación de email.
        Retorna el token generado.
        """
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_sent_at = timezone.now()
        self.save()
        return self.email_verification_token
    
    def clear_verification_token(self):
        """Limpia el token de verificación después de usarlo"""
        self.email_verification_token = None
        self.email_verification_sent_at = None
        self.save()
    
    @property
    def is_profile_complete(self):
        """Verifica si el perfil está completo"""
        required_fields = [
            self.first_name,
            self.last_name,
            self.specialty,
            self.license_number,
            self.phone
        ]
        return all(required_fields)
    
    @property
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 0 or self.is_staff or self.is_superuser
    
    @property
    def role_name(self):
        """Devuelve el nombre del rol"""
        return dict(self.ROLE_CHOICES).get(self.role, 'Unknown')
    
    @property
    def verification_status(self):
        """Retorna el estado completo de verificación del usuario"""
        return {
            'email_verified': self.is_email_verified,
            'account_verified': self.is_verified,
            'profile_complete': self.is_profile_complete
        }