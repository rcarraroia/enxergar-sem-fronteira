/**
 * COMPONENTE DE ESTATÍSTICAS DO EVENTO
 * Mostra resumo de presenças, óculos vendidos e faturamento
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useEventControlStats } from "@/hooks/admin-v2/useEventControl";
import {
  CheckCircle,
  DollarSign,
  Glasses,
  UserCheck,
  Users,
  UserX
} from "lucide-react";
import React from "react";

interface EventStatsProps {
  eventDateId: string;
}

export const EventStats: React.FC<EventStatsProps> = ({ eventDateId }) => {
  const { data: stats, isLoading, error } = useEventControlStats(eventDateId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-red-600 text-center">Erro ao carregar estatísticas</p>
        </CardContent>
      </Card>
    );
  }

  const attendanceRate = stats.total > 0 ? (stats.present / stats.total * 100).toFixed(1) : "0";
  const conversionRate = stats.present > 0 ? (stats.withGlasses / stats.present * 100).toFixed(1) : "0";
  const completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : "0";

  const statsCards = [
    {
      title: "Total Inscritos",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Inscrições confirmadas"
    },
    {
      title: "Presentes",
      value: stats.present,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${attendanceRate}% de presença`,
      badge: stats.present > 0 ? `${attendanceRate}%` : undefined
    },
    {
      title: "Ausentes",
      value: stats.absent,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Não compareceram"
    },
    {
      title: "Com Óculos",
      value: stats.withGlasses,
      icon: Glasses,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${conversionRate}% conversão`,
      badge: stats.withGlasses > 0 ? `${conversionRate}%` : undefined
    },
    {
      title: "Finalizados",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      description: `${completionRate}% completo`,
      badge: stats.completed > 0 ? `${completionRate}%` : undefined
    },
    {
      title: "Faturamento",
      value: `R$ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Vendas de óculos"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
                {stat.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {stat.badge}
                  </Badge>
                )}
              </div>

              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
