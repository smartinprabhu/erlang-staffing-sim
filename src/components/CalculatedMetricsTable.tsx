import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import {
  calculateEffectiveVolume,
  calculateRequiredAgents,
  calculateVariance,
  calculateSLA,
  calculateOccupancy,
  calculateInflux,
  calculateAgentDistributionRatio,
  erlangAgents,
  erlangUtilization,
  calculateCallTrend
} from "@/lib/erlang";

interface CalculatedMetricsTableProps {
  volumeMatrix: number[][];
  ahtMatrix: number[][];
  rosterGrid: string[][];
  configData: {
    plannedAHT: number;
    slaTarget: number;
    serviceTime: number;
    inOfficeShrinkage: number;
    outOfOfficeShrinkage: number;
    billableBreak: number;
    shiftDuration: string;
  };
  weeks: 4 | 8 | 12;
}

export function CalculatedMetricsTable({ 
  volumeMatrix, 
  ahtMatrix, 
  rosterGrid, 
  configData,
  weeks 
}: CalculatedMetricsTableProps) {
  
  // Helper function to calculate metrics for each time interval using exact Excel formulas
  const calculateMetrics = () => {
    const metrics = [];
    const totalDays = weeks * 7;
    
    // Calculate total agents across all intervals for distribution ratio
    const totalAgents = rosterGrid.reduce((total, row) => {
      return total + row.reduce((rowSum, val) => rowSum + (parseInt(val) || 0), 0);
    }, 0) || 1;
    
    // Process each 30-minute interval (Excel SMORT format: 12:30 AM to 12:00 AM)
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      // Excel starts at 12:30 AM (0:30), so we add 30 minutes to the base calculation
      const totalMinutes = (intervalIndex * 30) + 30; // Start from 30 minutes (12:30 AM)
      const hour = Math.floor(totalMinutes / 60) % 24; // Wrap around at 24 hours
      const minute = totalMinutes % 60;
      
      const timeDisplay = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const timeDisplayAMPM = `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
      
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
      
      // Get rostered agents for this interval (sum across all shifts)
      const rosteredAgents = rosterGrid[intervalIndex] ? 
        rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
      
      // EXACT EXCEL SMORT FORMULAS (Based on Excel cells BA7, BB7, BC7, etc.):
      
      // 1. Effective Volume (BA7): ((SUM(D7:AY7)*(1-$BA$1))*(1-$BB$1))*(1-$AZ$1)
      const effectiveVolume = calculateEffectiveVolume(
        totalVolume, 
        configData.outOfOfficeShrinkage, 
        configData.inOfficeShrinkage, 
        configData.billableBreak
      );
      
      // 2. Required Agents (BB7): IF(BD7<=0,0,Agents($A$1,$B$1,BD7*2,BE7))
      // Traffic Intensity = Volume * AHT / 3600 (converted to Erlangs)
      const trafficIntensity = (effectiveVolume * avgAHT) / 3600;
      const requiredAgents = effectiveVolume > 0 ? 
        erlangAgents(configData.slaTarget / 100, configData.serviceTime, trafficIntensity, avgAHT) : 0;
      
      // 3. Variance (BC7): POWER((BA7-BB7),2) - Actually it's just the difference
      const variance = calculateVariance(rosteredAgents, requiredAgents);
      
      // 4. Call Trend (Could be actual vs forecast comparison)
      const callTrend = calculateCallTrend(effectiveVolume, totalVolume);
      
      // 5. Service Level (BF7): SLA(BA7,$B$1,BD7*2,BE7) - Erlang-C SLA calculation
      const serviceLevel = rosteredAgents > 0 ? 
        calculateSLA(effectiveVolume, avgAHT, configData.serviceTime, rosteredAgents) * 100 : 0;
      
      // 6. Occupancy (BG7): Utilisation(BA7,BD7*2,BE7) - Erlang utilization
      const occupancy = rosteredAgents > 0 ? 
        erlangUtilization(trafficIntensity, rosteredAgents) * 100 : 0;
      
      // 7. Influx = Calls per hour (Volume / 0.5 hours)
      const influx = calculateInflux(effectiveVolume, 0.5);
      
      // 8. Agent Distribution Ratio = (Agents in this interval / Total agents) * 100
      const agentDistributionRatio = calculateAgentDistributionRatio(rosteredAgents, totalAgents);
      
      if (totalVolume > 0 || rosteredAgents > 0) {
        metrics.push({
          time: timeDisplay, // Use Excel 24-hour format
          actual: rosteredAgents,
          requirement: Math.round(requiredAgents * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          callTrend,
          aht: Math.round(avgAHT / 60 * 10) / 10, // Convert to minutes with 1 decimal
          serviceLevel: Math.round(serviceLevel * 10) / 10,
          occupancy: Math.round(occupancy * 10) / 10,
          influx: Math.round(influx),
          agentDistributionRatio: Math.round(agentDistributionRatio * 10) / 10
        });
      }
    }
    
    return metrics;
  };

  const metrics = calculateMetrics();

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'time':
        const minutes = Math.floor(value / 60);
        const seconds = value % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      default:
        return value.toString();
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-chart-2"; // Green for positive variance
    if (variance < -2) return "text-chart-1"; // Red for significant negative variance
    return "text-chart-4"; // Yellow for slight negative variance
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-3 w-3 inline ml-1" />;
    if (variance < 0) return <TrendingDown className="h-3 w-3 inline ml-1" />;
    return null;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculated Metrics Table
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Real-time metrics calculated from Volume, AHT, and Roster inputs. All formulas are displayed below.
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="border border-border p-2 text-left min-w-20 bg-card font-medium">Time</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">Actual</th>
                <th className="border border-border p-2 text-center min-w-20 bg-card font-medium">Requirement</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">Variance</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">Call Trend</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">AHT</th>
                <th className="border border-border p-2 text-center min-w-20 bg-card font-medium">Service Level</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">Occupancy</th>
                <th className="border border-border p-2 text-center min-w-16 bg-card font-medium">Influx</th>
                <th className="border border-border p-2 text-center min-w-20 bg-card font-medium">Agent Ratio</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="border border-border p-2 font-medium bg-muted/20">{metric.time}</td>
                  <td className="border border-border p-2 text-center">{metric.actual}</td>
                  <td className="border border-border p-2 text-center">{metric.requirement}</td>
                  <td className={`border border-border p-2 text-center ${getVarianceColor(metric.variance)}`}>
                    {metric.variance}
                    {getVarianceIcon(metric.variance)}
                  </td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.callTrend, 'percentage')}</td>
                  <td className="border border-border p-2 text-center">{metric.aht} min</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.serviceLevel, 'percentage')}</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.occupancy, 'percentage')}</td>
                  <td className="border border-border p-2 text-center">{metric.influx}</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.agentDistributionRatio, 'percentage')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Formulas Documentation - EXACT EXCEL SMORT FORMULAS */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/20 rounded-lg text-sm">
            <h4 className="font-medium mb-3">Excel SMORT Cell Formulas:</h4>
            <div className="space-y-2">
              <p><strong>Effective Volume (BA7)</strong> = ((SUM(D7:AY7)*(1-$BA$1))*(1-$BB$1))*(1-$AZ$1)</p>
              <p><strong>Required Agents (BB7)</strong> = IF(BD7&lt;=0,0,Agents($A$1,$B$1,BD7*2,BE7))</p>
              <p><strong>Variance (BC7)</strong> = POWER((BA7-BB7),2)</p>
              <p><strong>Call Trend</strong> = (Actual Volume ÷ Forecast Volume) × 100%</p>
            </div>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg text-sm">
            <h4 className="font-medium mb-3">Excel VBA Erlang Functions:</h4>
            <div className="space-y-2">
              <p><strong>Service Level (BF7)</strong> = SLA(BA7,$B$1,BD7*2,BE7)</p>
              <p><strong>Occupancy (BG7)</strong> = Utilisation(BA7,BD7*2,BE7)</p>
              <p><strong>Influx</strong> = Volume ÷ 0.5 hours (calls/hour)</p>
              <p><strong>Agent Ratio</strong> = (Agents in Interval ÷ Total Agents) × 100%</p>
              <p><strong>Traffic Intensity</strong> = (Volume × AHT) ÷ 3600 (Erlangs)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}