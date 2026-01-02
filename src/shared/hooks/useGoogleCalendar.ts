// src/shared/hooks/useGoogleCalendar.ts

import { useState, useEffect, useCallback } from 'react';
import { googleCalendarService, CalendarEvent } from '@/services/googleCalendarService';
import { useToast } from '@/shared/hooks/use-toast';

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (window.location.hash.includes('access_token')) {
        setIsLoading(true);
        try {
          const success = await googleCalendarService.handleCallback();
          if (success) {
            setIsConnected(true);
            setUserEmail(googleCalendarService.getUserEmail());
            toast({
              title: "¡Conectado!",
              description: "Tu cuenta de Google Calendar ha sido conectada exitosamente",
            });
          }
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo conectar con Google Calendar",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const checkConnection = useCallback(() => {
    const connected = googleCalendarService.isConnected();
    setIsConnected(connected);
    if (connected) {
      setUserEmail(googleCalendarService.getUserEmail());
    }
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      await googleCalendarService.connect();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar la conexión con Google Calendar",
      });
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    googleCalendarService.disconnect();
    setIsConnected(false);
    setUserEmail(null);
    toast({
      title: "Desconectado",
      description: "Tu cuenta de Google Calendar ha sido desconectada",
    });
  }, [toast]);

  const createEvent = useCallback(async (event: CalendarEvent): Promise<string | null> => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "No conectado",
        description: "Debes conectar tu cuenta de Google Calendar primero",
      });
      return null;
    }

    setIsLoading(true);
    try {
      const eventId = await googleCalendarService.createEvent(event);
      toast({
        title: "Evento creado",
        description: "El evento ha sido agregado a tu Google Calendar",
      });
      return eventId;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el evento",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const updateEvent = useCallback(async (eventId: string, event: CalendarEvent): Promise<boolean> => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "No conectado",
        description: "Debes conectar tu cuenta de Google Calendar primero",
      });
      return false;
    }

    setIsLoading(true);
    try {
      await googleCalendarService.updateEvent(eventId, event);
      toast({
        title: "Evento actualizado",
        description: "El evento ha sido actualizado en tu Google Calendar",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el evento",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!isConnected) {
      return false;
    }

    setIsLoading(true);
    try {
      await googleCalendarService.deleteEvent(eventId);
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado de tu Google Calendar",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el evento",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  const getEvents = useCallback(async (startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    if (!isConnected) {
      return [];
    }

    setIsLoading(true);
    try {
      const events = await googleCalendarService.getEvents(startDate, endDate);
      return events;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron obtener los eventos",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, toast]);

  return {
    isConnected,
    userEmail,
    isLoading,
    connect,
    disconnect,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvents,
    checkConnection
  };
}