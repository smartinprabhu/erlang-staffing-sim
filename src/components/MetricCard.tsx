import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: "blue" | "green" | "orange" | "red";
  trend?: "up" | "down";
}

export function MetricCard({ title, value, subtitle, icon: Icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    blue: "border-l-chart-blue text-chart-blue",
    green: "border-l-chart-green text-chart-green",
    orange: "border-l-chart-orange text-chart-orange",
    red: "border-l-chart-red text-chart-red"
  };

  return (
    <Card className={`border-l-4 ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-col items-end">
            <Icon className="h-8 w-8 mb-2" />
            {trend && (
              <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-chart-green' : 'text-chart-red'}`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}