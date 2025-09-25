import React, { useState } from "react";
import { useEventsAdmin } from "@/hooks/useEventsAdmin";
import { useAsaasDonation } from "@/hooks/useAsaasDonation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DonationForm = () => {
  const { events } = useEventsAdmin();
  const { createDonation, loading } = useAsaasDonation();
  
  const [formData, setFormData] = useState({
    eventId: "",
    amount: "",
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.eventId || !formData.amount || !formData.donorName || !formData.donorEmail) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createDonation({
        eventId: formData.eventId,
        amount: parseFloat(formData.amount),
        donorName: formData.donorName,
        donorEmail: formData.donorEmail,
        donorPhone: formData.donorPhone,
        description: formData.description
      });

      // Reset form
      setFormData({
        eventId: "",
        amount: "",
        donorName: "",
        donorEmail: "",
        donorPhone: "",
        description: ""
      });
    } catch (error) {
      console.error("Erro ao criar doação:", error);
    }
  };

  const selectedEvent = events?.find(e => e.id === formData.eventId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-primary" />
          <CardTitle>Nova Campanha de Doação</CardTitle>
        </div>
        <CardDescription>
          Crie uma campanha de doação para um evento específico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventId">Evento *</Label>
            <Select value={formData.eventId} onValueChange={(value) => setFormData(prev => ({ ...prev, eventId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.city} - {event.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Valor da Doação *</Label>
            <Input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="R$ 0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="donorName">Nome do Doador *</Label>
            <Input
              type="text"
              id="donorName"
              value={formData.donorName}
              onChange={(e) => setFormData(prev => ({ ...prev, donorName: e.target.value }))}
              placeholder="Nome Completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="donorEmail">Email do Doador *</Label>
            <Input
              type="email"
              id="donorEmail"
              value={formData.donorEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, donorEmail: e.target.value }))}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="donorPhone">Telefone do Doador</Label>
            <Input
              type="tel"
              id="donorPhone"
              value={formData.donorPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, donorPhone: e.target.value }))}
              placeholder="(XX) XXXX-XXXX"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes adicionais sobre a doação"
            />
          </div>

          <Button disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando
              </>
            ) : (
              "Criar Campanha de Doação"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
