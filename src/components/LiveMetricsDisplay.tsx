
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target } from "lucide-react";

interface LiveMetricsDisplayProps {
  sla: number;
  occupancy: number;
}

export function LiveMetricsDisplay({ sla, occupancy }: LiveMetricsDisplayProps) {
  return (
    <div className="flex gap-4 mb-4">
      <Card className="border-l-4 border-l-chart-blue">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-chart-blue" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">SLA</p>
              <p className="text-xl font-bold text-chart-blue">{sla.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-chart-orange">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-chart-orange" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
              <p className="text-xl font-bold text-chart-orange">{occupancy.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
