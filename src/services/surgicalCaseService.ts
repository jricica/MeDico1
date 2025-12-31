// src/services/surgicalCaseService.ts

import { authService } from '@/shared/services/authService';
import type { 
  SurgicalCase, 
  CreateCaseData, 
  UpdateCaseData, 
  CaseStats,
  AssistedCasesResponse,
  InvitationResponse,
  Procedure
} from '@/types/surgical-case';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class SurgicalCaseService {
  /**
   * Helper method to handle responses and errors properly
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    // Si la respuesta no es JSON, probablemente es un error HTML
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        contentType,
        body: text.substring(0, 500)
      });
      
      throw new Error(
        `Error del servidor: La API devolvió ${response.status} ${response.statusText}. ` +
        `Verifica que el endpoint exista en Django y que el servidor esté corriendo.`
      );
    }

    // Si hay un error HTTP, intenta parsear el JSON de error
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`);
      } catch (e) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }

    return await response.json();
  }

  // ==================== CASOS PROPIOS ====================

  /**
   * Get all surgical cases
   */
  async getCases(params?: {
    status?: string;
    hospital?: number;
    date_from?: string;
    date_to?: string;
    search?: string;
    assisted_only?: boolean;
  }): Promise<SurgicalCase[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      
      const url = `${API_URL}/api/v1/medico/cases/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await authService.authenticatedFetch(url);
      return await this.handleResponse<SurgicalCase[]>(response);
    } catch (error: any) {
      console.error('Error fetching cases:', error);
      throw error;
    }
  }

  /**
   * Get a single surgical case by ID
   */
  async getCase(id: number): Promise<SurgicalCase> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${id}/`
      );
      return await this.handleResponse<SurgicalCase>(response);
    } catch (error: any) {
      console.error('Error fetching case:', error);
      throw error;
    }
  }

  /**
   * Get statistics for the dashboard
   */
  async getStats(): Promise<CaseStats> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/stats/`
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Stats endpoint returned non-JSON response');
        return {
          total_cases: 0,
          total_procedures: 0,
          total_value: 0,
          cases_by_status: {},
          cases_by_specialty: {},
          recent_cases: []
        };
      }

      const data = await response.json();
      
      const transformedData: CaseStats = {
        total_cases: data.total_cases,
        total_procedures: data.total_procedures,
        total_value: data.total_value,
        cases_by_status: data.cases_by_status || {},
        cases_by_specialty: Object.entries(data.cases_by_specialty || {}).reduce((acc, [key, count]) => {
          acc[key] = { count: count as number, total_value: 0 };
          return acc;
        }, {} as Record<string, { count: number; total_value: number }>),
        recent_cases: data.recent_cases || []
      };
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        total_cases: 0,
        total_procedures: 0,
        total_value: 0,
        cases_by_status: {},
        cases_by_specialty: {},
        recent_cases: []
      };
    }
  }

  /**
   * Create a new surgical case
   */
  async createCase(data: CreateCaseData): Promise<SurgicalCase> {
    try {
      console.log('Creating case with data:', data);
      
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      
      return await this.handleResponse<SurgicalCase>(response);
    } catch (error: any) {
      console.error('Error creating case:', error);
      throw error;
    }
  }

  /**
   * Update a surgical case
   */
  async updateCase(id: number, data: UpdateCaseData): Promise<SurgicalCase> {
    try {
      console.log('Updating case with data:', data);
      
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${id}/`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      );
      
      return await this.handleResponse<SurgicalCase>(response);
    } catch (error: any) {
      console.error('Error updating case:', error);
      throw error;
    }
  }

  /**
   * Delete a surgical case
   */
  async deleteCase(id: number): Promise<void> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${id}/`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to delete case');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error deleting case:', error);
      throw error;
    }
  }

  /**
   * Actualizar solo el estado de un caso
   */
  async updateStatus(id: number, status: string): Promise<SurgicalCase> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${id}/update-status/`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );
      return await this.handleResponse<SurgicalCase>(response);
    } catch (error: any) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

  // ==================== PROCEDIMIENTOS ====================

  /**
   * Agregar un procedimiento a un caso existente
   */
  async addProcedure(caseId: number, procedure: Omit<Procedure, 'id'>): Promise<Procedure> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${caseId}/add-procedure/`,
        {
          method: 'POST',
          body: JSON.stringify(procedure),
        }
      );
      return await this.handleResponse<Procedure>(response);
    } catch (error: any) {
      console.error('Error adding procedure:', error);
      throw error;
    }
  }

  /**
   * Eliminar un procedimiento de un caso
   */
  async removeProcedure(caseId: number, procedureId: number): Promise<void> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${caseId}/remove-procedure/${procedureId}/`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to remove procedure');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error removing procedure:', error);
      throw error;
    }
  }

  // ==================== CASOS ASISTIDOS ====================

  /**
   * Obtener casos donde el usuario es ayudante
   * Separa en invitaciones pendientes y casos aceptados
   */
  async getAssistedCases(): Promise<AssistedCasesResponse> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/assisted/`
      );
      return await this.handleResponse<AssistedCasesResponse>(response);
    } catch (error: any) {
      console.error('Error fetching assisted cases:', error);
      throw error;
    }
  }

  /**
   * Aceptar una invitación como médico ayudante
   */
  async acceptInvitation(caseId: number): Promise<InvitationResponse> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${caseId}/accept-invitation/`,
        {
          method: 'POST',
        }
      );
      return await this.handleResponse<InvitationResponse>(response);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Rechazar una invitación como médico ayudante
   */
  async rejectInvitation(caseId: number): Promise<InvitationResponse> {
    try {
      const response = await authService.authenticatedFetch(
        `${API_URL}/api/v1/medico/cases/${caseId}/reject-invitation/`,
        {
          method: 'POST',
        }
      );
      return await this.handleResponse<InvitationResponse>(response);
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  }

  // ==================== ESTADOS DE PROCESO ====================

  /**
   * Marcar cirugía como operada
   */
  async toggleOperated(id: number, isOperated: boolean): Promise<SurgicalCase> {
    return this.updateCase(id, { is_operated: isOperated });
  }

  /**
   * Marcar cirugía como facturada
   */
  async toggleBilled(id: number, isBilled: boolean): Promise<SurgicalCase> {
    return this.updateCase(id, { is_billed: isBilled });
  }

  /**
   * Marcar cirugía como cobrada
   */
  async togglePaid(id: number, isPaid: boolean): Promise<SurgicalCase> {
    return this.updateCase(id, { is_paid: isPaid });
  }

  // ==================== UTILIDADES ====================

  /**
   * Verificar si una cirugía puede ser eliminada
   */
  canDelete(surgicalCase: SurgicalCase): { allowed: boolean; reason?: string } {
    if (!surgicalCase.is_paid) {
      return {
        allowed: false,
        reason: 'No se puede eliminar una cirugía que no ha sido cobrada'
      };
    }
    return { allowed: true };
  }

  /**
   * Verificar si el usuario puede editar un caso
   */
  canEdit(surgicalCase: SurgicalCase): boolean {
    return surgicalCase.can_edit ?? false;
  }

  /**
   * Verificar si el usuario es el dueño de un caso
   */
  isOwner(surgicalCase: SurgicalCase): boolean {
    return surgicalCase.is_owner ?? false;
  }

  /**
   * Verificar si el caso tiene invitación pendiente
   */
  hasPendingInvitation(surgicalCase: SurgicalCase): boolean {
    return !!(surgicalCase.assistant_doctor && !surgicalCase.assistant_accepted);
  }

  /**
   * Verificar si el caso está aceptado por el ayudante
   */
  isAcceptedByAssistant(surgicalCase: SurgicalCase): boolean {
    return !!(surgicalCase.assistant_doctor && surgicalCase.assistant_accepted);
  }
}

export const surgicalCaseService = new SurgicalCaseService();