import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResults } from "./ContactCenterApp";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

interface OccupancyChartProps {
  results: SimulationResults;
}

export function OccupancyChart({ results }: OccupancyChartProps) {
  // Generate daily occupancy trend data
  const dailyData = Array.from({ length: 28 }, (_, i) => {
    const baseDate = new Date('2025-06-29');
    baseDate.setDate(baseDate.getDate() + i);
    
    return {
      date: `${baseDate.getDate().toString().padStart(2, '0')}/${(baseDate.getMonth() + 1).toString().padStart(2, '0')}`,
      occupancy: Math.random() * 20 + 80 // Random occupancy between 80-100%
    };
  });

  // Generate hourly pattern data
  const hourlyData = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 8; // 8 AM to 5 PM
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      occupancy: Math.random() * 30 + 70 // Random occupancy between 70-100%
    };
  });

  return (
    <div className="space-y-6">
      {/* Occupancy Performance Card */}
      <Card className="border-l-4 border-l-chart-green">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Final Occupancy with Optimum Staffing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-4xl font-bold text-chart-orange mb-2">
              {results.finalOccupancy.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-chart-orange h-2 rounded-full transition-all duration-500"
                  style={{ width: `${results.finalOccupancy}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="h-4 w-4 text-chart-orange" />
              <span className="text-sm text-chart-orange">
                High Risk Zone (Target: 75-85%)
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Daily Occupancy Trend</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      fontSize={10}
                      domain={[0, 100]}
                    />
                    <ReferenceLine 
                      y={75} 
                      stroke="hsl(var(--chart-green))" 
                      strokeDasharray="5 5"
                      label="Min"
                    />
                    <ReferenceLine 
                      y={85} 
                      stroke="hsl(var(--chart-red))" 
                      strokeDasharray="5 5"
                      label="Max"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="hsl(var(--chart-teal))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-teal))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Hourly Occupancy Pattern</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="hsl(var(--foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))"
                      fontSize={10}
                      domain={[0, 100]}
                    />
                    <Bar 
                      dataKey="occupancy" 
                      fill="hsl(var(--chart-orange))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}