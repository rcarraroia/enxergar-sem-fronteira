
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string
  icon: LucideIcon
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  actions?: {
    label: string
    onClick: () => void
  }[]
  className?: string
}

export const MetricCard = ({ 
  title, 
  icon: Icon, 
  value, 
  subtitle, 
  trend, 
  actions, 
  className 
}: MetricCardProps) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
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
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
        )}
        
        {trend && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {trend.isPositive ? "+" : ""}{trend.value}
            </span>
            <span className="text-sm text-muted-foreground">{trend.label}</span>
          </div>
        )}

        {actions && actions.length > 0 && (
          <div className="space-y-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? "default" : "outline"}
                size="sm"
                className="w-full"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
