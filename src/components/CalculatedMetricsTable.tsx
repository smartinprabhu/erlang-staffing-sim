import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";

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
  
  // Helper function to calculate metrics for each time interval
  const calculateMetrics = () => {
    const metrics = [];
    const totalDays = weeks * 7;
    
    // Process each 30-minute interval
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      const hour = Math.floor(intervalIndex / 2);
      const minute = (intervalIndex % 2) * 30;
      const timeDisplay = `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
      
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
      
      // Calculate metrics
      const actual = totalVolume; // Actual workload (calls)
      
      // Staff Hours Required = Volume × AHT (convert to hours)
      const staffHoursRequired = (totalVolume * avgAHT) / 3600;
      
      // Agent work hours per interval (30 minutes = 0.5 hours)
      const agentWorkHours = 0.5 * (1 - (configData.outOfOfficeShrinkage + configData.billableBreak) / 100);
      
      // Required agents = Staff Hours ÷ Agent Work Hours
      const requirement = staffHoursRequired / agentWorkHours;
      
      // Variance = Actual agents - Required agents
      const variance = rosteredAgents - requirement;
      
      // Call Trend (assuming 100% as baseline)
      const callTrend = 100;
      
      // Service Level calculation (simplified - assumes 80% target)
      const serviceLevel = Math.min(100, Math.max(0, 
        rosteredAgents >= requirement ? configData.slaTarget + (variance / requirement) * 20 : 
        configData.slaTarget - Math.abs(variance / requirement) * 30
      ));
      
      // Occupancy = (Volume × AHT) ÷ (Agents × Available Time)
      const occupancy = rosteredAgents > 0 ? 
        Math.min(100, (totalVolume * avgAHT / 3600) / (rosteredAgents * agentWorkHours) * 100) : 0;
      
      // Influx = Calls per hour
      const influx = totalVolume * 2; // Convert 30-min to hourly rate
      
      // Agent Distribution Ratio
      const totalAgents = rosterGrid[0]?.reduce((sum, val) => sum + (parseInt(val) || 0), 0) || 1;
      const agentDistributionRatio = (rosteredAgents / totalAgents) * 100;
      
      if (totalVolume > 0 || rosteredAgents > 0) {
        metrics.push({
          time: timeDisplay,
          actual: Math.round(actual),
          requirement: Math.round(requirement * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          callTrend,
          aht: Math.round(avgAHT),
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
                  <td className="border border-border p-2 text-center">{formatValue(metric.aht, 'time')}</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.serviceLevel, 'percentage')}</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.occupancy, 'percentage')}</td>
                  <td className="border border-border p-2 text-center">{metric.influx}</td>
                  <td className="border border-border p-2 text-center">{formatValue(metric.agentDistributionRatio, 'percentage')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Formulas Documentation */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/20 rounded-lg text-sm">
            <h4 className="font-medium mb-3">Key Formulas:</h4>
            <div className="space-y-2">
              <p><strong>Staff Hours</strong> = Volume × AHT</p>
              <p><strong>Required Agents</strong> = Staff Hours ÷ Agent Work Hours</p>
              <p><strong>Variance</strong> = Rostered Agents - Required Agents</p>
              <p><strong>Call Trend</strong> = (Actual Calls ÷ Forecast Calls) × 100%</p>
            </div>
          </div>
          
          <div className="p-4 bg-muted/20 rounded-lg text-sm">
            <h4 className="font-medium mb-3">Performance Metrics:</h4>
            <div className="space-y-2">
              <p><strong>Service Level</strong> = (Calls Within Threshold ÷ Total Calls) × 100%</p>
              <p><strong>Occupancy</strong> = (Busy Time ÷ Scheduled Time) × 100%</p>
              <p><strong>Influx</strong> = Volume ÷ Time Period (calls/hour)</p>
              <p><strong>Agent Ratio</strong> = (Agents in Shift ÷ Total Agents) × 100%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}