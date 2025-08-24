
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CheckCircle, Clock, MapPin } from "lucide-react";
import { formatDate, formatTime } from "@/utils/timeFormat";

interface EventInfo {
  city: string
  title: string
  location: string
  address: string
  date: string
  start_time: string
  end_time: string
}

interface RegistrationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  eventInfo: EventInfo | null
  patientName: string
}

export const RegistrationSuccessModal = ({ 
  isOpen, 
  onClose, 
  eventInfo, 
  patientName 
}: RegistrationSuccessModalProps) => {
  if (!eventInfo) {return null;}

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-green-800">
            Inscrição Confirmada!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg text-gray-600">
            Olá, <strong>{patientName}</strong>! Sua inscrição foi realizada com sucesso.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Detalhes do Evento */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="mb-3 font-semibold text-primary">Detalhes da sua consulta:</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-lg">{eventInfo.city}</h4>
                <p className="text-sm text-muted-foreground">{eventInfo.title}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium">{formatDate(eventInfo.date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatTime(eventInfo.start_time)} às {formatTime(eventInfo.end_time)}</span>
                </div>
                
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">{eventInfo.location}</div>
                    <div className="text-muted-foreground">{eventInfo.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso Importante */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Lembrete Importante</h4>
                <div className="space-y-2 text-sm text-amber-700">
                  <p>
                    • Você receberá uma <strong>notificação por WhatsApp 24 horas antes</strong> da consulta
                  </p>
                  <p>
                    • Chegue com <strong>15 minutos de antecedência</strong> no local
                  </p>
                  <p>
                    • Traga um <strong>documento com foto</strong> para identificação
                  </p>
                  <p>
                    • Em caso de dúvidas, entre em contato através do nosso WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
              Status: Confirmado
            </Badge>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Entendi, obrigado!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
