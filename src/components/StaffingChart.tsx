import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationData } from "./ContactCenterApp";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Bar, ComposedChart, Tooltip, Cell } from "recharts";
import {
  calculateEffectiveVolume,
  calculateRequiredAgents,
  calculateVariance,
  calculateSLA,
  calculateOccupancy,
  erlangAgents,
  erlangUtilization
} from "@/lib/erlang";

interface StaffingChartProps {
  volumeMatrix: number[][];
  ahtMatrix?: number[][];
  rosterGrid: string[][];
  configData: ConfigurationData;
}

export function StaffingChart({ volumeMatrix, ahtMatrix = [], rosterGrid, configData }: StaffingChartProps) {
  
  // Helper function to calculate metrics using exact Excel formulas
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
    const rosteredAgents = rosterGrid[intervalIndex] ? 
      rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
    
    // EXACT EXCEL SMORT CALCULATIONS:
    
    // 1. Effective Volume (BA7): ((SUM(D7:AY7)*(1-$BA$1))*(1-$BB$1))*(1-$AZ$1)
    const effectiveVolume = calculateEffectiveVolume(
      totalVolume,
      configData.outOfOfficeShrinkage,
      configData.inOfficeShrinkage,
      configData.billableBreak
    );
    
    // 2. Required Agents (BB7): IF(BD7<=0,0,Agents($A$1,$B$1,BD7*2,BE7))
    const trafficIntensity = (effectiveVolume * avgAHT) / 3600;
    const requiredAgents = effectiveVolume > 0 ? 
      erlangAgents(configData.slaTarget / 100, configData.serviceTime, trafficIntensity, avgAHT) : 0;
    
    // 3. Variance = Actual - Required
    const variance = calculateVariance(rosteredAgents, requiredAgents);
    
    return {
      actual: rosteredAgents,
      requirement: Math.round(requiredAgents * 10) / 10,
      variance: Math.round(variance * 10) / 10
    };
  };

  // Generate chart data for all 48 intervals (Excel SMORT format: 12:30 AM to 12:00 AM)
  const chartData = Array.from({ length: 48 }, (_, i) => {
    // Excel starts at 12:30 AM (0:30), so we add 30 minutes to the base calculation
    const totalMinutes = (i * 30) + 30; // Start from 30 minutes (12:30 AM)
    const hour = Math.floor(totalMinutes / 60) % 24; // Wrap around at 24 hours
    const minute = totalMinutes % 60;
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
        <CardTitle>Live Interactive Chart: Actual vs Required (Excel SMORT Formula)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chart updates dynamically using exact Excel formulas for effective volume, required agents, and variance calculations
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
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Actual"
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="required" 
                stroke="#ef4444" 
                strokeWidth={3}
                strokeDasharray="8 4"
                name="Required"
                dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              />
              <Bar 
                dataKey="variance" 
                name="Variance"
                opacity={0.7}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.variance >= 0 ? "#f59e0b" : "#ef4444"} 
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Actual - Agents rostered from schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Required - Calculated from Volume × AHT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span>Positive Variance - Adequate staffing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Negative Variance - Understaffing</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
