/**
 * MODAL PARA REGISTRO DE COMPRA DE ÓCULOS
 * Permite inserir valor e data/hora de entrega
 */

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRegisterGlasses, type EventControlRegistration } from "@/hooks/admin-v2/useEventControl";
import { cn } from "@/lib/utils";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, DollarSign, Glasses } from "lucide-react";
import React, { useState } from "react";

interface GlassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: EventControlRegistration;
  attendedBy: string;
}

export const GlassesModal: React.FC<GlassesModalProps> = ({
  isOpen,
  onClose,
  registration,
  attendedBy
}) => {
  const [amount, setAmount] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState("14:00");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const registerGlassesMutation = useRegisterGlasses();

  // Data mínima: amanhã (não pode ser no mesmo dia do evento)
  const minDate = addDays(startOfDay(new Date()), 1);

  // Data máxima: 30 dias a partir de hoje
  const maxDate = addDays(new Date(), 30);

  const handleAmountChange = (value: string) => {
    // Remove tudo que não é dígito ou vírgula/ponto
    const cleanValue = value.replace(/[^\d,.]/g, "");

    // Substitui vírgula por ponto para cálculos
    const normalizedValue = cleanValue.replace(",", ".");

    // Valida formato de decimal
    if (normalizedValue === "" || /^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
      setAmount(cleanValue);
    }
  };

  const formatAmountDisplay = (value: string) => {
    if (!value) return "";

    const numericValue = parseFloat(value.replace(",", "."));
    if (isNaN(numericValue)) return value;

    return `R$ ${numericValue.toFixed(2).replace(".", ",")}`;
  };

  const getAmountValue = () => {
    if (!amount) return 0;
    return parseFloat(amount.replace(",", ".")) || 0;
  };

  const isValidAmount = () => {
    const value = getAmountValue();
    return value > 0 && value <= 10000; // Limite máximo de R$ 10.000
  };

  const isValidDeliveryDate = () => {
    if (!deliveryDate) return false;
    return isAfter(deliveryDate, startOfDay(new Date()));
  };

  const isValidDeliveryTime = () => {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(deliveryTime);
  };

  const canSubmit = () => {
    return isValidAmount() && isValidDeliveryDate() && isValidDeliveryTime();
  };

  const handleSubmit = async () => {
    if (!canSubmit() || !deliveryDate) return;

    try {
      // Combinar data e hora
      const [hours, minutes] = deliveryTime.split(":").map(Number);
      const finalDeliveryDate = new Date(deliveryDate);
      finalDeliveryDate.setHours(hours, minutes, 0, 0);

      await registerGlassesMutation.mutateAsync({
        registrationId: registration.id,
        amount: getAmountValue(),
        deliveryDate: finalDeliveryDate,
        attendedBy
      });

      // Reset form and close
      setAmount("");
      setDeliveryDate(undefined);
      setDeliveryTime("14:00");
      onClose();

    } catch (error) {
      console.error("Erro ao registrar óculos:", error);
    }
  };

  const handleClose = () => {
    // Reset form
    setAmount("");
    setDeliveryDate(undefined);
    setDeliveryTime("14:00");
    setIsCalendarOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Glasses className="h-5 w-5 text-purple-600" />
            <span>Registrar Compra de Óculos</span>
          </DialogTitle>
          <DialogDescription>
            Registre a compra de óculos para <strong>{registration.patient.nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Paciente:</span>
                <p className="font-medium">{registration.patient.nome}</p>
              </div>
              <div>
                <span className="text-gray-500">Telefone:</span>
                <p className="font-medium">{registration.patient.telefone}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor dos Óculos *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                placeholder="0,00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {amount && (
              <p className="text-sm text-gray-600">
                Valor: {formatAmountDisplay(amount)}
              </p>
            )}
            {amount && !isValidAmount() && (
              <p className="text-sm text-red-600">
                Valor deve ser maior que R$ 0,00 e menor que R$ 10.000,00
              </p>
            )}
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label>Data de Entrega *</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? (
                    format(deliveryDate, "dd/MM/yyyy - EEEE", { locale: ptBR })
                  ) : (
                    "Selecione a data de entrega"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={(date) => {
                    setDeliveryDate(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) =>
                    date < minDate || date > maxDate
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-gray-500">
              Entrega deve ser agendada para amanhã ou depois
            </p>
          </div>

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label htmlFor="deliveryTime">Horário de Entrega *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deliveryTime"
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Summary */}
          {canSubmit() && deliveryDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">Resumo da Entrega</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Valor:</strong> {formatAmountDisplay(amount)}</p>
                <p><strong>Data:</strong> {format(deliveryDate, "dd/MM/yyyy - EEEE", { locale: ptBR })}</p>
                <p><strong>Horário:</strong> {deliveryTime}</p>
                <p><strong>Paciente:</strong> {registration.patient.nome}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || registerGlassesMutation.isPending}
          >
            {registerGlassesMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
