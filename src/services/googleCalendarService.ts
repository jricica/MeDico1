// src/services/googleCalendarService.ts

interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

class GoogleCalendarService {
  private readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private readonly REDIRECT_URI = `${window.location.origin}/settings`;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ].join(' ');
  
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'google_access_token',
    REFRESH_TOKEN: 'google_refresh_token',
    TOKEN_EXPIRY: 'google_token_expiry',
    USER_EMAIL: 'google_user_email'
  };

  isConnected(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.USER_EMAIL);
  }

  async connect(): Promise<void> {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    
    authUrl.searchParams.append('client_id', this.CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'token'); // Flujo implícito
    authUrl.searchParams.append('scope', this.SCOPES);
    // ❌ REMOVIDO: access_type y prompt - no son compatibles con response_type=token
    
    window.location.href = authUrl.toString();
  }

  async handleCallback(): Promise<boolean> {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (!accessToken) return false;
    
    const expiryTime = Date.now() + (parseInt(expiresIn || '3600') * 1000);
    
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    
    await this.fetchUserInfo(accessToken);
    
    // Limpiar el hash de la URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return true;
  }

  private async fetchUserInfo(accessToken: string): Promise<void> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.email) {
        localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, data.email);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }

  disconnect(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(this.STORAGE_KEYS.USER_EMAIL);
  }

  private async getValidAccessToken(): Promise<string | null> {
    const token = localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY);
    
    if (!token || !expiry) {
      throw new Error('No estás conectado a Google Calendar');
    }
    
    // Si el token está por expirar (menos de 5 minutos), lanzar error
    if (Date.now() > parseInt(expiry) - 300000) {
      throw new Error('Tu sesión ha expirado. Por favor reconecta con Google Calendar');
    }
    
    return token;
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...event,
          reminders: event.reminders || {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 },
              { method: 'popup', minutes: 1440 }
            ]
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al crear evento en Calendar');
    }
    
    const data = await response.json();
    return data.id;
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al actualizar evento en Calendar');
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const token = await this.getValidAccessToken();
    
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al eliminar evento de Calendar');
    }
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const token = await this.getValidAccessToken();
    
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.append('timeMin', startDate.toISOString());
    url.searchParams.append('timeMax', endDate.toISOString());
    url.searchParams.append('singleEvents', 'true');
    url.searchParams.append('orderBy', 'startTime');
    
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error al obtener eventos del Calendar');
    }
    
    const data = await response.json();
    return data.items || [];
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { CalendarEvent };