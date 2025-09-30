/**
 * COMPONENTE CARD DE INSCRIÇÃO
 * Card individual para cada inscrito com ações de controle
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCompleteProcess,
  useConfirmAttendance,
  type EventControlRegistration
} from "@/hooks/admin-v2/useEventControl";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Glasses,
  Mail,
  Phone,
  UserCheck
} from "lucide-react";
import React, { useState } from "react";
import { GlassesModal } from "./GlassesModal";

interface RegistrationCardProps {
  registration: EventControlRegistration;
  attendedBy: string;
}

export const RegistrationCard: React.FC<RegistrationCardProps> = ({
  registration,
  attendedBy
}) => {
  const [isGlassesModalOpen, setIsGlassesModalOpen] = useState(false);

  const confirmAttendanceMutation = useConfirmAttendance();
  const completeProcessMutation = useCompleteProcess();

  const getStatusInfo = () => {
    if (registration.process_completed) {
      return {
        icon: CheckCircle,
        label: "Finalizado",
        color: "bg-green-100 text-green-800",
        description: "Processo completo"
      };
    } else if (registration.purchased_glasses) {
      return {
        icon: Glasses,
        label: "Com Óculos",
        color: "bg-purple-100 text-purple-800",
        description: "Comprou óculos"
      };
    } else if (registration.attendance_confirmed) {
      return {
        icon: UserCheck,
        label: "Presente",
        color: "bg-blue-100 text-blue-800",
        description: "Presença confirmada"
      };
    } else {
      return {
        icon: Calendar,
        label: "Aguardando",
        color: "bg-gray-100 text-gray-800",
        description: "Inscrito"
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const handleConfirmAttendance = async () => {
    try {
      await confirmAttendanceMutation.mutateAsync({
        registrationId: registration.id,
        attendedBy
      });
    } catch (error) {
      console.error("Erro ao confirmar presença:", error);
    }
  };

  const handleCompleteProcess = async () => {
    try {
      await completeProcessMutation.mutateAsync({
        registrationId: registration.id,
        attendedBy
      });
    } catch (error) {
      console.error("Erro ao finalizar processo:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header with Status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {registration.patient.nome}
              </h3>
              <p className="text-sm text-gray-600">
                CPF: {registration.patient.cpf}
              </p>
            </div>

            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{registration.patient.telefone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{registration.patient.email}</span>
            </div>
          </div>

          {/* Glasses Info */}
          {registration.purchased_glasses && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Glasses className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-900">Óculos Comprados</span>
                </div>
                <Badge variant="outline" className="text-purple-700">
                  {formatCurrency(registration.glasses_purchase_amount || 0)}
                </Badge>
              </div>

              {registration.delivery_date && (
                <div className="flex items-center space-x-2 text-sm text-purple-700">
                  <Clock className="h-3 w-3" />
                  <span>Entrega: {formatDeliveryDate(registration.delivery_date)}</span>
                </div>
              )}
            </div>
          )}

          {/* Attendance Info */}
          {registration.attendance_confirmed && registration.attendance_confirmed_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-blue-700">
                <UserCheck className="h-3 w-3" />
                <span>
                  Presença confirmada em {format(new Date(registration.attendance_confirmed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {registration.attended_by && (
                <p className="text-xs text-blue-600 mt-1">
                  Por: {registration.attended_by}
                </p>
              )}
            </div>
          )}

          {/* Completion Info */}
          {registration.process_completed && registration.completed_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <CheckCircle className="h-3 w-3" />
                <span>
                  Processo finalizado em {format(new Date(registration.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!registration.attendance_confirmed && (
              <Button
                size="sm"
                onClick={handleConfirmAttendance}
                disabled={confirmAttendanceMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="h-4 w-4 mr-1" />
                {confirmAttendanceMutation.isPending ? "Confirmando..." : "Confirmar Presença"}
              </Button>
            )}

            {registration.attendance_confirmed && !registration.purchased_glasses && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsGlassesModalOpen(true)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Glasses className="h-4 w-4 mr-1" />
                Registrar Óculos
              </Button>
            )}

            {registration.purchased_glasses && !registration.process_completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsGlassesModalOpen(true)}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}

            {registration.attendance_confirmed && !registration.process_completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCompleteProcess}
                disabled={completeProcessMutation.isPending}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {completeProcessMutation.isPending ? "Finalizando..." : "Finalizar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Glasses Modal */}
      <GlassesModal
        isOpen={isGlassesModalOpen}
        onClose={() => setIsGlassesModalOpen(false)}
        registration={registration}
        attendedBy={attendedBy}
      />
    </>
  );
};
