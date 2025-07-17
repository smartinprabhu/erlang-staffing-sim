import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationData } from "./ContactCenterApp";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Bar, ComposedChart, Tooltip, Cell } from "recharts";

interface StaffingChartProps {
  volumeMatrix: number[][];
  ahtMatrix?: number[][];
  rosterGrid: string[][];
  configData: ConfigurationData;
}

export function StaffingChart({ volumeMatrix, ahtMatrix = [], rosterGrid, configData }: StaffingChartProps) {
  
  // Helper function to calculate metrics (same as CalculatedMetricsTable)
  const calculateMetricsForInterval = (intervalIndex: number) => {
    const totalDays = configData.weeks * 7;
    
    // Calculate totals across all days for this interval
    let totalVolume = 0;
    let totalAHT = 0;
    let validDays = 0;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const volume = volumeMatrix[dayIndex]?.[intervalIndex] || 0;
      const aht = ahtMatrix[dayIndex]?.[intervalIndex] || configData.plannedAHT;
      
      if (volume > 0) {
        totalVolume += volume;
        totalAHT += aht;
        validDays++;
      }
    }
    
    const avgAHT = validDays > 0 ? totalAHT / validDays : configData.plannedAHT;
    
    // Get rostered agents for this interval
    const rosteredAgents = parseInt(rosterGrid[0]?.[intervalIndex] || '0') || 0;
    
    // Calculate metrics using same formulas as CalculatedMetricsTable
    const actual = rosteredAgents; // Actual agents rostered
    
    // Staff Hours Required = Volume × AHT (convert to hours)
    const staffHoursRequired = (totalVolume * avgAHT) / 3600;
    
    // Agent work hours per interval (30 minutes = 0.5 hours)
    const agentWorkHours = 0.5 * (1 - (configData.outOfOfficeShrinkage + configData.billableBreak) / 100);
    
    // Required agents = Staff Hours ÷ Agent Work Hours
    const requirement = staffHoursRequired / agentWorkHours;
    
    // Variance = Actual agents - Required agents
    const variance = actual - requirement;
    
    return {
      actual,
      requirement: Math.round(requirement * 10) / 10,
      variance: Math.round(variance * 10) / 10
    };
  };

  // Generate chart data for all 48 intervals (every 30 minutes)
  const chartData = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const metrics = calculateMetricsForInterval(i);
    
    return {
      time: timeLabel,
      actual: metrics.actual,
      required: metrics.requirement,
      variance: metrics.variance,
      fill: metrics.variance >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"
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
                dataKey="time" 
                stroke="hsl(var(--foreground))"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={1}
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
                stroke="hsl(var(--chart-3))" 
                strokeWidth={3}
                name="Actual"
                dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="required" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={3}
                strokeDasharray="8 4"
                name="Required"
                dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 4 }}
              />
              <Bar 
                dataKey="variance" 
                name="Variance"
                opacity={0.7}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.variance >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"} 
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-3 rounded-full" />
            <span>Actual - Agents rostered from schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-4 rounded-full" />
            <span>Required - Calculated from Volume × AHT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-2 rounded-full" />
            <span>Positive Variance - Adequate staffing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-chart-1 rounded-full" />
            <span>Negative Variance - Understaffing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}