import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationData } from "./ContactCenterApp";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Bar, ComposedChart, Tooltip, Cell } from "recharts";

interface StaffingChartProps {
  volumeMatrix: number[][];
  rosterGrid: string[][];
  configData: ConfigurationData;
}

export function StaffingChart({ volumeMatrix, rosterGrid, configData }: StaffingChartProps) {
  // Generate chart data for 24 hours (48 intervals)
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const intervalIndex = i * 2; // Convert hour to interval index
    
    // Calculate actual staffing from roster
    const actualStaffing = rosterGrid.length > 0 ? (parseInt(rosterGrid[0][intervalIndex]) || 0) : 0;
    
    // Calculate required staffing (simplified Erlang-C approximation)
    const volume = volumeMatrix[0]?.[intervalIndex] || 0;
    const requiredStaffing = Math.ceil(volume * configData.plannedAHT / 1800 * 1.2); // Basic approximation
    
    const difference = actualStaffing - requiredStaffing;
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      actual: actualStaffing,
      required: requiredStaffing,
      difference: difference,
      fill: difference >= 0 ? "hsl(var(--chart-green))" : "hsl(var(--chart-orange))"
    };
  });

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Live Interactive Chart: Actual vs Required</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chart updates dynamically as you edit the roster grid or any input parameter
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--chart-blue))" 
                strokeWidth={2}
                name="Actual"
                dot={{ fill: "hsl(var(--chart-blue))", strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="required" 
                stroke="hsl(var(--chart-red))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Required"
                dot={{ fill: "hsl(var(--chart-red))", strokeWidth: 2 }}
              />
              <Bar 
                dataKey="difference" 
                name="Difference"
                opacity={0.7}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.difference >= 0 ? "hsl(var(--chart-green))" : "hsl(var(--chart-orange))"} 
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-blue rounded-full" />
            <span>Actual - Count of agents scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-red rounded-full" />
            <span>Required - Count needed based on Erlang-C</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-green rounded-full" />
            <span>Positive Difference - Overstaffing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-orange rounded-full" />
            <span>Negative Difference - Understaffing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}