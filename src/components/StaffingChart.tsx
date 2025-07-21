import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationData } from "./ContactCenterApp";
import { TransposedCalculatedMetricsTable } from "./TransposedCalculatedMetricsTable";
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
  onRosterGridChange: (grid: string[][]) => void;
}

export function StaffingChart({ volumeMatrix, ahtMatrix = [], rosterGrid, configData, onRosterGridChange }: StaffingChartProps) {
  const [shiftCounts, setShiftCounts] = useState<number[]>(Array(48).fill(17));
  const [rosterCounts, setRosterCounts] = useState<number[]>(Array(48).fill(0));
  
  // Generate time intervals exactly as Excel SMORT (48 intervals starting from 12:30 AM to 12:00 AM)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const totalMinutes = (i * 30) + 30;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
      excelFormat: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  });
  
  // Initialize roster counts from existing grid
  useEffect(() => {
    const newRosterCounts = Array(48).fill(0);
    for (let i = 0; i < 48; i++) {
      if (rosterGrid[i]) {
        const columnSum = rosterGrid.reduce((sum, row) => {
          const value = parseInt(row[i]) || 0;
          return sum + value;
        }, 0);
        if (columnSum > 0) {
          newRosterCounts[i] = Math.round(columnSum / 17); // Approximate original roster value
        }
      }
    }
    setRosterCounts(newRosterCounts);
  }, [rosterGrid]);
  
  const updateShiftCount = (colIndex: number, value: number) => {
    const newShiftCounts = [...shiftCounts];
    newShiftCounts[colIndex] = value;
    setShiftCounts(newShiftCounts);
    
    // Re-apply roster value with new shift count
    const rosterValue = rosterCounts[colIndex];
    if (rosterValue > 0) {
      updateRosterCount(colIndex, rosterValue);
    }
  };
  
  const updateRosterCount = (colIndex: number, value: number) => {
    const newRosterCounts = [...rosterCounts];
    newRosterCounts[colIndex] = value;
    setRosterCounts(newRosterCounts);
    
    // Update the roster grid
    if (value > 0) {
      const newGrid = [...rosterGrid];
      
      // Initialize grid if needed
      for (let i = 0; i < 48; i++) {
        if (!newGrid[i]) newGrid[i] = Array(48).fill('');
      }
      
      // Clear the column first
      for (let i = 0; i < 48; i++) {
        newGrid[i][colIndex] = '';
      }
      
      // Fill intersection cells with wrap-around logic
      const shiftCount = shiftCounts[colIndex] || 17;
      for (let rowOffset = 0; rowOffset < shiftCount; rowOffset++) {
        const targetRow = (colIndex + rowOffset) % 48;
        newGrid[targetRow][colIndex] = value.toString();
      }
      
      onRosterGridChange(newGrid);
    } else {
      // Clear the column
      const newGrid = [...rosterGrid];
      for (let i = 0; i < 48; i++) {
        if (!newGrid[i]) newGrid[i] = Array(48).fill('');
        newGrid[i][colIndex] = '';
      }
      onRosterGridChange(newGrid);
    }
  };
  
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
    
    // Get rostered agents for this interval and apply shrinkage factors
    const rawRosteredAgents = rosterGrid[intervalIndex] ? 
      rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
      
    const rosteredAgents = rawRosteredAgents *
      (1 - configData.outOfOfficeShrinkage / 100) *
      (1 - configData.inOfficeShrinkage / 100) *
      (1 - configData.billableBreak / 100);
    
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
      actual: Math.round(rosteredAgents),
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
          All 48 intervals aligned vertically - Chart updates dynamically using exact Excel formulas
        </p>
      </CardHeader>
      <CardContent>
        {/* Horizontally scrollable container for all 48 intervals */}
        <div className="overflow-x-auto border rounded-lg">
          <div className="min-w-[2400px]"> {/* Ensure minimum width for 48 intervals */}
            
            {/* Roster Grid - All 48 intervals */}
            <div className="border-b">
              <table className="w-full border-collapse text-xs">
                <thead>
                  {/* Header with all 48 time intervals */}
                  <tr>
                    <th className="border border-border p-1 text-left min-w-16 bg-[#475569] text-white font-medium text-xs sticky left-0 z-10">
                      TIME
                    </th>
                    {intervals.map((interval, i) => (
                      <th key={i} className="border border-border p-1 text-center min-w-12 bg-card">
                        <div className="font-medium text-xs">{interval.excelFormat}</div>
                      </th>
                    ))}
                  </tr>
                  
                  {/* Shift row - All 48 intervals */}
                  <tr className="bg-[#475569]/20">
                    <td className="border border-border p-1 text-center font-medium text-xs bg-[#475569] text-white sticky left-0 z-10">
                      Shift
                    </td>
                    {intervals.map((_, i) => (
                      <td key={i} className="border border-border p-0.5 text-center">
                        <input
                          type="number"
                          className="w-full bg-[#475569]/10 border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6"
                          value={shiftCounts[i]}
                          onChange={(e) => updateShiftCount(i, Number(e.target.value))}
                          placeholder="17"
                          min="0"
                          style={{ width: '100%', minWidth: '40px' }}
                        />
                      </td>
                    ))}
                  </tr>
                  
                  {/* Roster row - All 48 intervals */}
                  <tr className="bg-[#475569]/70">
                    <td className="border border-border p-1 text-center font-medium text-xs bg-[#475569] text-white sticky left-0 z-10">
                      Roster
                    </td>
                    {intervals.map((_, i) => (
                      <td key={i} className="border border-border p-0.5 text-center">
                        <input
                          type="number"
                          className={`w-full bg-[#475569] border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6 ${
                            rosterCounts[i] > 0 ? 'bg-[#475569]/30 text-white font-medium' : ''
                          }`}
                          value={rosterCounts[i] || ''}
                          onChange={(e) => updateRosterCount(i, Number(e.target.value))}
                          placeholder="0"
                          min="0"
                          style={{ width: '100%', minWidth: '40px' }}
                        />
                      </td>
                    ))}
                  </tr>
                </thead>
              </table>
            </div>
            
            {/* Chart Section - Aligned with intervals */}
            <div className="h-96 border-b">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--foreground))"
                    fontSize={8}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{ fontSize: 8 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground))"
                    fontSize={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Actual"
                    dot={{ fill: "#3b82f6", strokeWidth: 1, r: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="required" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    name="Required"
                    dot={{ fill: "#ef4444", strokeWidth: 1, r: 2 }}
                  />
                  <Bar 
                    dataKey="variance" 
                    name="Variance"
                    opacity={0.6}
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
            
            {/* Legend */}
            <div className="py-2 flex justify-center gap-4 text-xs border-b">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Required</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Positive Variance</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Negative Variance</span>
              </div>
            </div>
            
            {/* Transposed CalculatedMetricsTable - Aligned with intervals */}
            <div>
              <TransposedCalculatedMetricsTable 
                volumeMatrix={volumeMatrix}
                ahtMatrix={ahtMatrix}
                rosterGrid={rosterGrid}
                configData={{
                  plannedAHT: configData.plannedAHT,
                  slaTarget: configData.slaTarget,
                  serviceTime: configData.serviceTime,
                  inOfficeShrinkage: configData.inOfficeShrinkage,
                  outOfOfficeShrinkage: configData.outOfOfficeShrinkage,
                  billableBreak: configData.billableBreak,
                  shiftDuration: configData.shiftDuration
                }}
                weeks={configData.weeks}
              />
            </div>
            
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
