"""
Serializers para casos quirúrgicos y procedimientos
"""
from rest_framework import serializers
from apps.medico.models import SurgicalCase, CaseProcedure, Hospital


class CaseProcedureSerializer(serializers.ModelSerializer):
    """Serializer para procedimientos individuales dentro de un caso"""
    
    class Meta:
        model = CaseProcedure
        fields = [
            'id',
            'surgery_code',
            'surgery_name',
            'specialty',
            'grupo',
            'rvu',
            'hospital_factor',
            'calculated_value',
            'notes',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_rvu(self, value):
        """Validar que RVU sea positivo"""
        if value < 0:
            raise serializers.ValidationError("RVU debe ser un valor positivo")
        return value
    
    def validate_calculated_value(self, value):
        """Validar que el valor calculado sea positivo"""
        if value < 0:
            raise serializers.ValidationError("El valor calculado debe ser positivo")
        return value


class SurgicalCaseListSerializer(serializers.ModelSerializer):
    """Serializer para listado de casos (vista resumida)"""
    
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    total_rvu = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    total_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    procedure_count = serializers.IntegerField(read_only=True)
    primary_specialty = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Campos de estado
    is_operated = serializers.BooleanField(default=False)
    is_billed = serializers.BooleanField(default=False)
    is_paid = serializers.BooleanField(default=False)
    
    # NUEVOS: Campos de médico ayudante
    assistant_display_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = SurgicalCase
        fields = [
            'id',
            'patient_name',
            'surgery_date',
            'hospital',
            'hospital_name',
            'status',
            'status_display',
            'is_operated',
            'is_billed',
            'is_paid',
            'assistant_doctor',
            'assistant_doctor_name',
            'assistant_display_name',
            'total_rvu',
            'total_value',
            'procedure_count',
            'primary_specialty',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SurgicalCaseDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para casos incluyendo todos los procedimientos"""
    
    procedures = CaseProcedureSerializer(many=True, read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_rate_multiplier = serializers.DecimalField(
        source='hospital.rate_multiplier',
        max_digits=5,
        decimal_places=2,
        read_only=True
    )
    total_rvu = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    total_value = serializers.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        read_only=True
    )
    procedure_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Campos de estado
    is_operated = serializers.BooleanField(default=False)
    is_billed = serializers.BooleanField(default=False)
    is_paid = serializers.BooleanField(default=False)
    
    # NUEVOS: Campos de médico ayudante
    assistant_display_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = SurgicalCase
        fields = [
            'id',
            'patient_name',
            'patient_id',
            'patient_age',
            'patient_gender',
            'hospital',
            'hospital_name',
            'hospital_rate_multiplier',
            'surgery_date',
            'surgery_time',
            'status',
            'status_display',
            'is_operated',
            'is_billed',
            'is_paid',
            'assistant_doctor',
            'assistant_doctor_name',
            'assistant_display_name',
            'notes',
            'diagnosis',
            'procedures',
            'total_rvu',
            'total_value',
            'procedure_count',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class SurgicalCaseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar casos con procedimientos anidados"""
    
    procedures = CaseProcedureSerializer(many=True, required=False)
    
    # Campos de estado (opcionales en creación/actualización)
    is_operated = serializers.BooleanField(default=False, required=False)
    is_billed = serializers.BooleanField(default=False, required=False)
    is_paid = serializers.BooleanField(default=False, required=False)
    
    # NUEVOS: Campos de médico ayudante (opcionales)
    assistant_doctor = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.none(),  # Se configurará en __init__
        required=False,
        allow_null=True
    )
    assistant_doctor_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    class Meta:
        model = SurgicalCase
        fields = [
            'id',
            'patient_name',
            'patient_id',
            'patient_age',
            'patient_gender',
            'hospital',
            'surgery_date',
            'surgery_time',
            'status',
            'notes',
            'diagnosis',
            'is_operated',
            'is_billed',
            'is_paid',
            'assistant_doctor',
            'assistant_doctor_name',
            'procedures',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Configurar queryset para assistant_doctor
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if 'request' in self.context:
            # Permitir seleccionar cualquier usuario como ayudante
            self.fields['assistant_doctor'].queryset = User.objects.all()
    
    def validate_patient_name(self, value):
        """Validar que el nombre no esté vacío"""
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre del paciente es requerido")
        return value.strip()
    
    def validate(self, data):
        """Validaciones de lógica de negocio"""
        # NUEVO: Validar que no se usen ambos campos de ayudante a la vez
        assistant_doctor = data.get('assistant_doctor')
        assistant_doctor_name = data.get('assistant_doctor_name')
        
        if assistant_doctor and assistant_doctor_name:
            raise serializers.ValidationError({
                'assistant_doctor_name': 'No puedes tener un colega registrado y un nombre manual al mismo tiempo'
            })
        
        # Validaciones de estados
        is_operated = data.get('is_operated', getattr(self.instance, 'is_operated', False) if self.instance else False)
        is_billed = data.get('is_billed', getattr(self.instance, 'is_billed', False) if self.instance else False)
        is_paid = data.get('is_paid', getattr(self.instance, 'is_paid', False) if self.instance else False)
        
        # No se puede facturar sin operar
        if is_billed and not is_operated:
            raise serializers.ValidationError({
                'is_billed': 'No se puede marcar como facturado sin estar operado'
            })
        
        # No se puede cobrar sin facturar
        if is_paid and not is_billed:
            raise serializers.ValidationError({
                'is_paid': 'No se puede marcar como cobrado sin estar facturado'
            })
        
        return data
    
    def create(self, validated_data):
        """Crear caso con procedimientos anidados"""
        procedures_data = validated_data.pop('procedures', [])
        
        # Crear el caso
        case = SurgicalCase.objects.create(**validated_data)
        
        # Crear los procedimientos
        for index, proc_data in enumerate(procedures_data):
            # Si proc_data no tiene 'order', usar el índice
            if 'order' not in proc_data:
                proc_data['order'] = index
            CaseProcedure.objects.create(
                case=case,
                **proc_data
            )
        
        return case
    
    def update(self, instance, validated_data):
        """Actualizar caso y sus procedimientos"""
        procedures_data = validated_data.pop('procedures', None)
        
        # Actualizar campos del caso
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Si se enviaron procedimientos, reemplazar todos
        if procedures_data is not None:
            # Eliminar procedimientos existentes
            instance.procedures.all().delete()
            
            # Crear nuevos procedimientos
            for order, proc_data in enumerate(procedures_data):
                CaseProcedure.objects.create(
                    case=instance,
                    order=order,
                    **proc_data
                )
        
        return instance


class CaseStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de casos"""
    
    total_cases = serializers.IntegerField()
    total_procedures = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=15, decimal_places=2)
    cases_by_status = serializers.DictField()
    cases_by_specialty = serializers.DictField()
    recent_cases = SurgicalCaseListSerializer(many=True)