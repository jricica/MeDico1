from rest_framework import serializers
from .models import Client, Advertisement


class ClientSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Client"""
    
    # Campos calculados
    is_active = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    ad_count = serializers.ReadOnlyField()
    
    # Campos relacionados
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    plan_display = serializers.CharField(source='get_plan_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id',
            'company_name',
            'contact_name',
            'email',
            'phone',
            'plan',
            'plan_display',
            'amount_paid',
            'currency',
            'start_date',
            'end_date',
            'status',
            'status_display',
            'notes',
            'is_active',
            'days_remaining',
            'ad_count',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def create(self, validated_data):
        """Asigna automáticamente el usuario que crea el cliente"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class AdvertisementSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Advertisement"""
    
    # Campos calculados
    is_active = serializers.ReadOnlyField()
    ctr = serializers.ReadOnlyField()
    
    # Campos relacionados
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    placement_display = serializers.CharField(source='get_placement_display', read_only=True)
    
    # URL completa de la imagen
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Advertisement
        fields = [
            'id',
            'client',
            'client_name',
            'campaign_name',
            'title',
            'description',
            'image',
            'image_url',
            'image_alt_text',
            'redirect_url',
            'open_in_new_tab',
            'placement',
            'placement_display',
            'priority',
            'start_date',
            'end_date',
            'status',
            'status_display',
            'impressions',
            'clicks',
            'ctr',
            'is_active',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 
            'impressions', 
            'clicks', 
            'created_at', 
            'updated_at', 
            'created_by'
        ]
    
    def get_image_url(self, obj):
        """Retorna la URL completa de la imagen"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def create(self, validated_data):
        """Asigna automáticamente el usuario que crea el anuncio"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class AdvertisementListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar anuncios (sin campos pesados)"""
    
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    placement_display = serializers.CharField(source='get_placement_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Advertisement
        fields = [
            'id',
            'client_name',
            'campaign_name',
            'image_url',
            'placement',
            'placement_display',
            'status',
            'status_display',
            'start_date',
            'end_date',
            'impressions',
            'clicks',
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ActiveAdvertisementSerializer(serializers.ModelSerializer):
    """Serializer para anuncios activos que se muestran en la app"""
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Advertisement
        fields = [
            'id',
            'title',
            'image_url',
            'image_alt_text',
            'redirect_url',
            'open_in_new_tab',
            'placement',
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None