

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface OrganizerStatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
}

export const OrganizerStatsCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-primary",
  trend
}: OrganizerStatsCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            {title}
          </div>
          {trend && (
            <span className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${iconColor}`}>{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>
        )}
      </CardContent>
    </Card>
  );
};
