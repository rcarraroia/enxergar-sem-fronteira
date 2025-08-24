
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDate, EventFormData } from "@/hooks/useEventsAdmin";
import { Calendar, Loader2, MapPin, Plus, Save, Trash2, X } from "lucide-react";

interface EventFormProps {
  initialData?: EventFormData & { id?: string }
  onSubmit: (data: EventFormData & { id?: string }) => void
  onCancel: () => void
  isLoading: boolean
}

export const EventForm: React.FC<EventFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<EventFormData>({
    city: "",
    description: "",
    location: "",
    address: "",
    status: "open",
    dates: [{
      id: "",
      date: "",
      start_time: "08:00",
      end_time: "18:00",
      total_slots: 50,
      available_slots: 50
    }]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        city: initialData.city,
        description: initialData.description || "",
        location: initialData.location,
        address: initialData.address,
        status: initialData.status,
        dates: initialData.dates || [{
          id: "",
          date: "",
          start_time: "08:00",
          end_time: "18:00",
          total_slots: 50,
          available_slots: 50
        }]
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      ...(initialData?.id && { id: initialData.id })
    });
  };

  const addDate = () => {
    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, {
        id: "",
        date: "",
        start_time: "08:00",
        end_time: "18:00",
        total_slots: 50,
        available_slots: 50
      }]
    }));
  };

  const removeDate = (index: number) => {
    if (formData.dates.length > 1) {
      setFormData(prev => ({
        ...prev,
        dates: prev.dates.filter((_, i) => i !== index)
      }));
    }
  };

  const updateDate = (index: number, field: keyof EventDate, value: any) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.map((date, i) => 
        i === index 
          ? { 
              ...date, 
              [field]: value,
              // Se atualizou total_slots e é uma nova data, atualiza available_slots também
              ...(field === "total_slots" && !date.id && { available_slots: value })
            }
          : date
      )
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar Evento" : "Criar Novo Evento"}
        </CardTitle>
        <CardDescription>
          Preencha os dados do atendimento oftalmológico gratuito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas do evento */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações do Atendimento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="city">Cidade do Atendimento *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ex: São Paulo, Rio de Janeiro, Belo Horizonte"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva procedimentos disponíveis, requisitos especiais, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Centro de Saúde Municipal"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade - CEP"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "open" | "closed" | "full") => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto para Inscrições</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                    <SelectItem value="full">Lotado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Datas do evento */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas do Atendimento
              </h3>
              <Button type="button" variant="outline" onClick={addDate}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Data
              </Button>
            </div>

            {formData.dates.map((date, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Data {index + 1}</h4>
                  {formData.dates.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDate(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`date-${index}`}>Data *</Label>
                    <Input
                      id={`date-${index}`}
                      type="date"
                      value={date.date}
                      onChange={(e) => updateDate(index, "date", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`start-time-${index}`}>Início *</Label>
                    <Input
                      id={`start-time-${index}`}
                      type="time"
                      value={date.start_time}
                      onChange={(e) => updateDate(index, "start_time", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`end-time-${index}`}>Fim *</Label>
                    <Input
                      id={`end-time-${index}`}
                      type="time"
                      value={date.end_time}
                      onChange={(e) => updateDate(index, "end_time", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`slots-${index}`}>Vagas *</Label>
                    <Input
                      id={`slots-${index}`}
                      type="number"
                      min="1"
                      max="1000"
                      value={date.total_slots}
                      onChange={(e) => updateDate(index, "total_slots", parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {initialData ? "Atualizar" : "Criar"} Atendimento
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
