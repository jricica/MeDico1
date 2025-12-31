// src/components/cases/InvitationCard.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Hospital, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { surgicalCaseService } from '@/services/surgicalCaseService';
import type { SurgicalCase } from '@/types/surgical-case';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvitationCardProps {
  case: SurgicalCase;
  onAccept?: (caseId: number) => void;
  onReject?: (caseId: number) => void;
}

export function InvitationCard({ case: surgicalCase, onAccept, onReject }: InvitationCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await surgicalCaseService.acceptInvitation(surgicalCase.id);
      
      toast({
        title: '¡Invitación aceptada!',
        description: 'Ahora puedes ver los detalles de este caso quirúrgico.',
        variant: 'default',
      });

      onAccept?.(surgicalCase.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aceptar la invitación',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      await surgicalCaseService.rejectInvitation(surgicalCase.id);
      
      toast({
        title: 'Invitación rechazada',
        description: 'El médico principal será notificado.',
        variant: 'default',
      });

      onReject?.(surgicalCase.id);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo rechazar la invitación',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const formattedDate = surgicalCase.surgery_date 
    ? format(new Date(surgicalCase.surgery_date), "d 'de' MMMM, yyyy", { locale: es })
    : 'Fecha no especificada';

  const formattedTime = surgicalCase.surgery_time 
    ? surgicalCase.surgery_time 
    : 'Hora no especificada';

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {surgicalCase.patient_name}
              <Badge variant="secondary" className="ml-2">
                Invitación pendiente
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">
              Invitado por: <span className="font-medium">{surgicalCase.created_by_name || 'Colega'}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fecha y hora */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Hospital */}
        <div className="flex items-center gap-2 text-sm">
          <Hospital className="h-4 w-4 text-muted-foreground" />
          <span>{surgicalCase.hospital_name || 'Hospital no especificado'}</span>
        </div>

        {/* Información del paciente */}
        {surgicalCase.patient_age && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{surgicalCase.patient_age} años</span>
            {surgicalCase.patient_gender && (
              <Badge variant="outline" className="ml-2">
                {surgicalCase.patient_gender === 'M' ? 'Masculino' : 
                 surgicalCase.patient_gender === 'F' ? 'Femenino' : 'Otro'}
              </Badge>
            )}
          </div>
        )}

        {/* Especialidad y procedimientos */}
        {surgicalCase.primary_specialty && (
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{surgicalCase.primary_specialty}</Badge>
            {surgicalCase.procedure_count && surgicalCase.procedure_count > 1 && (
              <span className="text-muted-foreground">
                + {surgicalCase.procedure_count - 1} más
              </span>
            )}
          </div>
        )}

        {/* Diagnóstico (si existe) */}
        {surgicalCase.diagnosis && (
          <div className="mt-3 p-3 bg-muted rounded-md text-sm">
            <p className="font-medium mb-1">Diagnóstico:</p>
            <p className="text-muted-foreground">{surgicalCase.diagnosis}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className="flex-1"
          variant="default"
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aceptando...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aceptar invitación
            </>
          )}
        </Button>

        <Button
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
          className="flex-1"
          variant="outline"
        >
          {isRejecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rechazando...
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Rechazar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}