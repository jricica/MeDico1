# apps/medico/models/surgical_case.py

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import Sum, Count, Q


class SurgicalCase(models.Model):
    """Casos quirúrgicos registrados por los médicos"""
    
    STATUS_CHOICES = [
        ('scheduled', 'Programado'),
        ('completed', 'Completado'),
        ('billed', 'Facturado'),
        ('paid', 'Pagado'),
        ('cancelled', 'Cancelado'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Masculino'),
        ('F', 'Femenino'),
        ('O', 'Otro'),
    ]
    
    # Información del paciente
    patient_name = models.CharField(
        max_length=255,
        verbose_name="Nombre del Paciente"
    )
    patient_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="ID del Paciente",
        help_text="Número de identificación o expediente del paciente"
    )
    patient_age = models.IntegerField(
        blank=True,
        null=True,
        verbose_name="Edad del Paciente"
    )
    patient_gender = models.CharField(
        max_length=1,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        verbose_name="Género del Paciente"
    )
    
    # Información de la cirugía
    hospital = models.ForeignKey(
        'Hospital',
        on_delete=models.PROTECT,
        related_name='surgical_cases',
        verbose_name="Hospital"
    )
    surgery_date = models.DateField(
        verbose_name="Fecha de Cirugía"
    )
    surgery_time = models.TimeField(
        blank=True,
        null=True,
        verbose_name="Hora de Cirugía"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        verbose_name="Estado"
    )
    
    # Nuevos campos de estado del proceso
    is_operated = models.BooleanField(
        default=False,
        verbose_name="Operado",
        help_text="Indica si la cirugía ya fue realizada"
    )
    is_billed = models.BooleanField(
        default=False,
        verbose_name="Facturado",
        help_text="Indica si la cirugía ya fue facturada"
    )
    is_paid = models.BooleanField(
        default=False,
        verbose_name="Cobrado",
        help_text="Indica si la cirugía ya fue cobrada"
    )
    
    # Información clínica
    diagnosis = models.TextField(
        blank=True,
        null=True,
        verbose_name="Diagnóstico"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas Adicionales"
    )
    
    # Metadatos
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_cases',
        verbose_name="Creado por"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última Actualización"
    )
    
    class Meta:
        verbose_name = 'Caso Quirúrgico'
        verbose_name_plural = 'Casos Quirúrgicos'
        ordering = ['-surgery_date', '-created_at']
        indexes = [
            models.Index(fields=['created_by', 'surgery_date']),
            models.Index(fields=['hospital', 'surgery_date']),
            models.Index(fields=['status']),
            models.Index(fields=['surgery_date']),
            models.Index(fields=['is_operated']),
            models.Index(fields=['is_billed']),
            models.Index(fields=['is_paid']),
        ]
    
    def __str__(self):
        return f"{self.patient_name} - {self.surgery_date}"
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # Validar que no se facture sin operar
        if self.is_billed and not self.is_operated:
            raise ValidationError({
                'is_billed': 'No se puede marcar como facturado sin haber sido operado'
            })
        
        # Validar que no se cobre sin facturar
        if self.is_paid and not self.is_billed:
            raise ValidationError({
                'is_paid': 'No se puede marcar como cobrado sin haber sido facturado'
            })
    
    def save(self, *args, **kwargs):
        """Override save para ejecutar validaciones"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def can_be_deleted(self):
        """Solo se puede eliminar si está cobrado"""
        return self.is_paid
    
    def delete(self, *args, **kwargs):
        """Override delete para validar que esté cobrado"""
        if not self.can_be_deleted():
            raise ValidationError(
                "No se puede eliminar una cirugía que no ha sido cobrada"
            )
        super().delete(*args, **kwargs)
    
    @property
    def total_rvu(self):
        """Calcular RVU total de todos los procedimientos"""
        return self.procedures.aggregate(
            total=Sum('rvu')
        )['total'] or 0
    
    @property
    def total_value(self):
        """Calcular valor total de todos los procedimientos"""
        return self.procedures.aggregate(
            total=Sum('calculated_value')
        )['total'] or 0
    
    @property
    def procedure_count(self):
        """Contar número de procedimientos"""
        return self.procedures.count()
    
    @property
    def primary_specialty(self):
        """Obtener la especialidad principal (la del primer procedimiento o más frecuente)"""
        first_procedure = self.procedures.first()
        return first_procedure.specialty if first_procedure else None


class CaseProcedure(models.Model):
    """Procedimientos individuales dentro de un caso quirúrgico"""
    
    case = models.ForeignKey(
        SurgicalCase,
        on_delete=models.CASCADE,
        related_name='procedures',
        verbose_name="Caso"
    )
    
    # Información del procedimiento (basado en CSVs)
    surgery_code = models.CharField(
        max_length=50,
        verbose_name="Código de Cirugía"
    )
    surgery_name = models.CharField(
        max_length=500,
        verbose_name="Nombre de la Cirugía"
    )
    specialty = models.CharField(
        max_length=100,
        verbose_name="Especialidad"
    )
    grupo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Grupo"
    )
    
    # Valores y cálculos
    rvu = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="RVU",
        help_text="Relative Value Units"
    )
    hospital_factor = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name="Factor del Hospital",
        help_text="Multiplicador del hospital para este procedimiento"
    )
    calculated_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Valor Calculado",
        help_text="RVU × Factor del Hospital"
    )
    
    # Notas y orden
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Notas del Procedimiento"
    )
    order = models.IntegerField(
        default=0,
        verbose_name="Orden",
        help_text="Orden del procedimiento en el caso"
    )
    
    # Metadatos
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última Actualización"
    )
    
    class Meta:
        verbose_name = 'Procedimiento del Caso'
        verbose_name_plural = 'Procedimientos del Caso'
        ordering = ['case', 'order']
        indexes = [
            models.Index(fields=['case', 'order']),
            models.Index(fields=['surgery_code']),
            models.Index(fields=['specialty']),
        ]
    
    def __str__(self):
        return f"{self.surgery_code} - {self.surgery_name}"
    
    def save(self, *args, **kwargs):
        """Calcular el valor automáticamente si no está establecido"""
        if not self.calculated_value:
            self.calculated_value = self.rvu * self.hospital_factor
        super().save(*args, **kwargs)