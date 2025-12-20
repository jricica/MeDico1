from django.shortcuts import render
from django.views.generic import TemplateView
from django.conf import settings
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from datetime import timedelta
from decimal import Decimal
import os

# Importar modelos de medico
from apps.medico.models import SurgicalCase, CaseProcedure, Hospital, Operation, Specialty

User = get_user_model()


class IndexView(TemplateView):
    def get(self, request, *args, **kwargs):
        if settings.DEBUG:
            import requests
            try:
                vite_response = requests.get('http://localhost:5173/', timeout=2)
                html_content = vite_response.text
                html_content = html_content.replace('src="/', 'src="http://localhost:5173/')
                html_content = html_content.replace('href="/', 'href="http://localhost:5173/')
                return HttpResponse(html_content, content_type='text/html')
            except requests.exceptions.RequestException:
                return HttpResponse("""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>MéDico1 - Error</title>
                        <style>
                            body { 
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            }
                            .container {
                                background: white;
                                padding: 40px;
                                border-radius: 10px;
                                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                                text-align: center;
                                max-width: 500px;
                            }
                            h1 { color: #e74c3c; margin-bottom: 20px; }
                            p { color: #555; line-height: 1.6; }
                            code {
                                background: #f4f4f4;
                                padding: 15px;
                                display: block;
                                border-radius: 5px;
                                margin: 20px 0;
                                font-family: 'Courier New', monospace;
                            }
                            .status {
                                background: #ecf0f1;
                                padding: 15px;
                                border-radius: 5px;
                                margin-top: 20px;
                            }
                            .ok { color: #27ae60; }
                            .error { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>⚠️ Frontend no disponible</h1>
                            <p>El servidor de Vite no está corriendo. Django está funcionando correctamente, pero necesitas iniciar el frontend.</p>
                            
                            <p><strong>En otra terminal ejecuta:</strong></p>
                            <code>npm run dev</code>
                            
                            <div class="status">
                                <p class="ok">✅ Backend Django: Funcionando</p>
                                <p class="error">❌ Frontend Vite: No disponible</p>
                            </div>
                            
                            <p style="margin-top: 20px; font-size: 14px; color: #999;">
                                O usa el comando personalizado que inicia ambos:<br>
                                <code style="display: inline; padding: 5px;">python manage.py runserver</code>
                            </p>
                        </div>
                    </body>
                    </html>
                """, content_type='text/html')
        else:
            return render(request, 'index.html')


# ============================================
# ADMIN API VIEWS - CON DATOS REALES
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_stats(request):
    """
    Obtiene estadísticas del dashboard de administración con datos reales.
    Requiere autenticación JWT y que el usuario sea staff.
    """
    
    # Total de usuarios registrados
    total_users = User.objects.count()
    
    # Total de casos quirúrgicos
    total_cases = SurgicalCase.objects.count()
    
    # Casos de este mes
    first_day_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    cases_this_month = SurgicalCase.objects.filter(
        created_at__gte=first_day_of_month
    ).count()
    
    # Estadísticas adicionales opcionales (comentadas por si las quieres usar)
    # total_procedures = CaseProcedure.objects.count()
    # total_hospitals = Hospital.objects.count()
    # total_value = SurgicalCase.objects.aggregate(
    #     total=Sum('procedures__calculated_value')
    # )['total'] or Decimal('0.00')
    
    return Response({
        'totalUsers': total_users,
        'totalCases': total_cases,
        'casesThisMonth': cases_this_month
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_activity(request):
    """
    Obtiene actividad reciente del sistema con datos reales.
    Combina usuarios nuevos, casos quirúrgicos y hospitales.
    Requiere autenticación JWT y que el usuario sea staff.
    """
    
    activities = []
    
    # 1. Últimos usuarios registrados (3 más recientes)
    recent_users = User.objects.order_by('-date_joined')[:3]
    for user in recent_users:
        activities.append({
            'id': f'user-{user.id}',
            'type': 'user',
            'description': f'Nuevo usuario registrado: {user.username}',
            'timestamp': user.date_joined.isoformat(),
            'user_name': user.get_full_name() or user.username
        })
    
    # 2. Últimos casos quirúrgicos creados (5 más recientes)
    recent_cases = SurgicalCase.objects.select_related('hospital', 'created_by').order_by('-created_at')[:5]
    for case in recent_cases:
        # Obtener el nombre del médico que creó el caso
        doctor_name = case.created_by.get_full_name() or case.created_by.username if case.created_by else 'Sistema'
        
        # Crear descripción con información del caso
        description = f'Nuevo caso quirúrgico: {case.patient_name} en {case.hospital.name}'
        
        activities.append({
            'id': f'case-{case.id}',
            'type': 'case',
            'description': description,
            'timestamp': case.created_at.isoformat(),
            'user_name': doctor_name
        })
    
    # 3. Últimos hospitales agregados (2 más recientes)
    recent_hospitals = Hospital.objects.order_by('-created_at')[:2]
    for hospital in recent_hospitals:
        activities.append({
            'id': f'hospital-{hospital.id}',
            'type': 'hospital',
            'description': f'Nuevo hospital registrado: {hospital.name}',
            'timestamp': hospital.created_at.isoformat(),
            'user_name': hospital.location or 'Sin ubicación'
        })
    
    # Ordenar todas las actividades por timestamp (más reciente primero)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Retornar las 10 actividades más recientes
    return Response(activities[:10])


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_users(request):
    """
    Obtiene lista completa de todos los usuarios del sistema.
    Incluye información de casos creados por cada usuario.
    Requiere autenticación JWT y que el usuario sea staff.
    """
    
    # Obtener todos los usuarios con sus campos principales
    users = User.objects.all().values(
        'id', 
        'username', 
        'email', 
        'first_name', 
        'last_name', 
        'is_staff', 
        'is_active', 
        'is_superuser',
        'date_joined', 
        'last_login'
    )
    
    # Convertir QuerySet a lista
    users_list = list(users)
    
    # Enriquecer cada usuario con información adicional
    for user in users_list:
        # Formatear fechas a formato ISO para el frontend
        if user['date_joined']:
            user['date_joined'] = user['date_joined'].isoformat()
        if user['last_login']:
            user['last_login'] = user['last_login'].isoformat()
        
        # Crear nombre completo
        full_name = f"{user['first_name']} {user['last_name']}".strip()
        user['full_name'] = full_name if full_name else user['username']
        
        # Contar casos quirúrgicos creados por este usuario
        user['cases_count'] = SurgicalCase.objects.filter(
            created_by_id=user['id']
        ).count()
        
        # Opcional: Agregar valor total de casos del usuario
        # total_value = SurgicalCase.objects.filter(
        #     created_by_id=user['id']
        # ).aggregate(
        #     total=Sum('procedures__calculated_value')
        # )['total']
        # user['total_cases_value'] = float(total_value) if total_value else 0.0
    
    return Response(users_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_hospitals(request):
    """
    Obtiene lista de hospitales con estadísticas de casos.
    Endpoint opcional para futura expansión del dashboard.
    """
    
    hospitals = Hospital.objects.annotate(
        cases_count=Count('surgical_cases')
    ).values(
        'id',
        'name',
        'location',
        'rate_multiplier',
        'cases_count',
        'created_at'
    )
    
    hospitals_list = list(hospitals)
    
    # Formatear fechas
    for hospital in hospitals_list:
        if hospital['created_at']:
            hospital['created_at'] = hospital['created_at'].isoformat()
        # Convertir Decimal a float para JSON
        if hospital['rate_multiplier']:
            hospital['rate_multiplier'] = float(hospital['rate_multiplier'])
    
    return Response(hospitals_list)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_procedures(request):
    """
    Obtiene lista de procedimientos más comunes.
    Endpoint opcional para futura expansión del dashboard.
    """
    
    # Top 10 procedimientos más usados
    top_procedures = CaseProcedure.objects.values(
        'surgery_code',
        'surgery_name',
        'specialty'
    ).annotate(
        usage_count=Count('id')
    ).order_by('-usage_count')[:10]
    
    return Response(list(top_procedures))