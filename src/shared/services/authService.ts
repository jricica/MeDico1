/**
 * Servicio de Autenticación para MeDico
 * Maneja todas las operaciones relacionadas con autenticación JWT
 */

import { parseAuthError, NetworkError, TokenRefreshError } from './authErrors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AUTH_ENDPOINTS = {
  register: `${API_URL}/api/auth/register/`,
  login: `${API_URL}/api/auth/login/`,
  logout: `${API_URL}/api/auth/logout/`,
  refresh: `${API_URL}/api/auth/refresh/`,
  me: `${API_URL}/api/auth/me/`,
  changePassword: `${API_URL}/api/auth/change-password/`,
};

// Tipos TypeScript
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: number;
  is_admin: boolean;
  plan: string;
  friend_code: string; // ← AGREGADO
  name: string;
  phone?: string;
  specialty?: string;
  license_number?: string;
  hospital_default?: string;
  avatar?: string;
  signature_image?: string;
  is_verified: boolean;
  is_email_verified: boolean;
  theme_preference: 'light' | 'dark' | 'system';
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialty?: string;
  license_number?: string;
  hospital_default?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  email_verification_sent?: boolean;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password2: string;
}

// Manejo de tokens en localStorage
const TOKEN_STORAGE_KEYS = {
  access: 'medico_access_token',
  refresh: 'medico_refresh_token',
  user: 'medico_user',
};

class AuthService {
  private refreshPromise: Promise<string> | null = null;

  /**
   * Guardar tokens en localStorage
   */
  private saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_STORAGE_KEYS.access, tokens.access);
    localStorage.setItem(TOKEN_STORAGE_KEYS.refresh, tokens.refresh);
  }

  /**
   * Guardar información del usuario en localStorage
   */
  private saveUser(user: User): void {
    localStorage.setItem(TOKEN_STORAGE_KEYS.user, JSON.stringify(user));
  }

  /**
   * Obtener access token de localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.access);
  }

  /**
   * Obtener refresh token de localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.refresh);
  }

  /**
   * Obtener usuario almacenado en localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(TOKEN_STORAGE_KEYS.user);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  clearAuth(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.access);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.refresh);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.user);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseAuthError(response);
      }

      const result: AuthResponse = await response.json();
      
      // Guardar tokens y usuario
      this.saveTokens(result.tokens);
      this.saveUser(result.user);

      return result;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NetworkError();
      }
      throw error;
    }
  }

  /**
   * Login de usuario
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(AUTH_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw await parseAuthError(response);
      }

      const result: AuthResponse = await response.json();
      
      // Guardar tokens y usuario
      this.saveTokens(result.tokens);
      this.saveUser(result.user);

      return result;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NetworkError();
      }
      throw error;
    }
  }

  /**
   * Logout de usuario
   */
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      try {
        await fetch(AUTH_ENDPOINTS.logout, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      } catch (error) {
        console.error('Error durante logout:', error);
      }
    }

    // Limpiar datos locales siempre
    this.clearAuth();
  }

  /**
   * Renovar access token usando refresh token
   * Implementa lock para prevenir múltiples refreshes simultáneos
   */
  async refreshAccessToken(): Promise<string> {
    // Si ya hay un refresh en progreso, retornar la misma promesa
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new TokenRefreshError('No refresh token available');
    }

    // Crear y guardar la promesa de refresh
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(AUTH_ENDPOINTS.refresh, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
          throw new TokenRefreshError('Refresh token expired or invalid');
        }

        const result = await response.json();
        localStorage.setItem(TOKEN_STORAGE_KEYS.access, result.access);

        return result.access;
      } catch (error) {
        if (error instanceof TypeError) {
          throw new NetworkError();
        }
        this.clearAuth();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Obtener información del usuario actual desde el servidor
   */
  async fetchCurrentUser(): Promise<User> {
    const response = await this.authenticatedFetch(AUTH_ENDPOINTS.me);

    if (!response.ok) {
      throw new Error('Unable to fetch user data');
    }

    const user: User = await response.json();
    this.saveUser(user);

    return user;
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.authenticatedFetch(AUTH_ENDPOINTS.me, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseAuthError(response);
    }

    const result = await response.json();
    this.saveUser(result.user);

    return result.user;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    const response = await this.authenticatedFetch(AUTH_ENDPOINTS.changePassword, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseAuthError(response);
    }
  }

  /**
   * Realizar fetch con autenticación automática (incluye retry con refresh token)
   * 🔧 FIXED: Detecta FormData y no agrega Content-Type para permitir subida de archivos
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    // 🔧 CRITICAL FIX: Preparar headers correctamente según el tipo de body
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      ...(options.headers as Record<string, string>),
    };

    // ⚠️ NO agregar Content-Type si el body es FormData
    // El navegador lo hace automáticamente con el boundary correcto
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Intentar request con access token actual
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Si es 401, intentar refresh y reintentar
    if (response.status === 401) {
      try {
        const newAccessToken = await this.refreshAccessToken();
        
        // Preparar headers nuevamente para el retry
        const retryHeaders: Record<string, string> = {
          'Authorization': `Bearer ${newAccessToken}`,
          ...(options.headers as Record<string, string>),
        };

        // ⚠️ NO agregar Content-Type si el body es FormData
        if (!(options.body instanceof FormData)) {
          retryHeaders['Content-Type'] = 'application/json';
        }
        
        // Reintentar request con nuevo token
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
      } catch (error) {
        this.clearAuth();
        window.location.href = '/login';
        throw error;
      }
    }

    return response;
  }
}

// Exportar instancia singleton
export const authService = new AuthService();