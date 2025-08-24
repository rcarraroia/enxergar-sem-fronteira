/**
 * METRIC CARD V2 - Redesigned sem violações de hooks
 * CORREÇÃO: Sem useRef, sem violações das regras de hooks
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon} from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    direction: "up" | "down"
    period: string
  }
  loading?: boolean
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {trend && (
          <div className="flex items-center gap-2">
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.direction === "up" ? "text-green-600" : "text-red-600"
            )}>
              {trend.direction === "up" ? "+" : ""}{trend.value}
            </span>
            <span className="text-sm text-muted-foreground">{trend.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};