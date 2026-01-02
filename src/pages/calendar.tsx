// src/pages/calendar.tsx

import { useState, useEffect } from "react";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { useGoogleCalendar } from "@/shared/hooks/useGoogleCalendar";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { CalendarEvent } from "@/services/googleCalendarService";

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const CalendarPage = () => {
  const {
    isConnected,
    userEmail,
    isLoading,
    connect,
    getEvents
  } = useGoogleCalendar();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadMonthEvents();
    }
  }, [currentDate, isConnected]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, events]);

  const loadMonthEvents = async () => {
    setLoadingEvents(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const fetchedEvents = await getEvents(startOfMonth, endOfMonth);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startingDayOfWeek = firstDay.getDay();
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date)
      });
    }
    
    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        events: getEventsForDate(date)
      });
    }
    
    // Días del siguiente mes
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: getEventsForDate(date)
      });
    }
    
    setCalendarDays(days);
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('es-GT', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isConnected) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="pb-4 border-b">
            <h1 className="text-3xl font-semibold mb-1 tracking-tight">Calendario</h1>
            <p className="text-muted-foreground">
              Visualiza tus eventos de Google Calendar
            </p>
          </div>

          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <CalendarIcon className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                Conecta tu Google Calendar
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Para ver tus eventos aquí, primero necesitas conectar tu cuenta de Google Calendar
              </p>
              <Button onClick={connect} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Conectar Google Calendar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-1 tracking-tight">Calendario</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Conectado como <strong>{userEmail}</strong>
              </p>
            </div>
            <Badge className="gap-1" variant="default">
              <CalendarIcon className="w-3 h-3" />
              Google Calendar
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario principal */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Hoy
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Headers de días */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Días del calendario */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDay(day)}
                        className={`
                          relative min-h-[80px] p-2 rounded-lg border text-left transition-all
                          ${day.isCurrentMonth 
                            ? 'bg-background hover:bg-accent' 
                            : 'bg-muted/30 text-muted-foreground'
                          }
                          ${day.isToday 
                            ? 'border-primary border-2 ring-2 ring-primary/20' 
                            : 'border-border'
                          }
                          ${selectedDay?.date.toDateString() === day.date.toDateString()
                            ? 'ring-2 ring-primary'
                            : ''
                          }
                        `}
                      >
                        <span className={`
                          text-sm font-medium
                          ${day.isToday ? 'text-primary font-bold' : ''}
                        `}>
                          {day.date.getDate()}
                        </span>
                        
                        {day.events.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {day.events.slice(0, 2).map((event, i) => (
                              <div 
                                key={i}
                                className="text-xs truncate bg-primary/10 text-primary px-1 rounded"
                              >
                                {event.summary}
                              </div>
                            ))}
                            {day.events.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{day.events.length - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Panel de detalles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {selectedDay 
                  ? `${selectedDay.date.getDate()} de ${MONTHS[selectedDay.date.getMonth()]}`
                  : 'Selecciona un día'
                }
              </CardTitle>
              <CardDescription>
                {selectedDay?.events.length || 0} evento{selectedDay?.events.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDay ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Selecciona un día para ver los eventos</p>
                </div>
              ) : selectedDay.events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay eventos este día</p>
                </div>
              ) : (
                selectedDay.events.map((event, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-semibold">{event.summary}</h4>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(event.start.dateTime)}</span>
                        <span>-</span>
                        <span>{formatTime(event.end.dateTime)}</span>
                        <Badge variant="outline" className="ml-auto">
                          {formatDuration(event.start.dateTime, event.end.dateTime)}
                        </Badge>
                      </div>

                      {event.location && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      )}

                      {event.description && (
                        <div className="text-sm text-muted-foreground pt-2 border-t">
                          {event.description}
                        </div>
                      )}

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees.length} asistente{event.attendees.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;