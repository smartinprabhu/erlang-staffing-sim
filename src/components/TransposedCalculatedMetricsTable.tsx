
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

interface TransposedCalculatedMetricsTableProps {
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

export function TransposedCalculatedMetricsTable({ 
  volumeMatrix, 
  ahtMatrix, 
  rosterGrid, 
  configData,
  weeks 
}: TransposedCalculatedMetricsTableProps) {
  
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
      
      // Get rostered agents for this interval (sum across all shifts) and apply shrinkage factors
      const rawRosteredAgents = rosterGrid[intervalIndex] ? 
        rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
      
      // Apply same shrinkage factors as effective volume calculation
      const rosteredAgents = rawRosteredAgents * 
        (1 - configData.outOfOfficeShrinkage / 100) * 
        (1 - configData.inOfficeShrinkage / 100) * 
        (1 - configData.billableBreak / 100);
      
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
          actual: Math.round(rosteredAgents * 10) / 10,
          requirement: Math.round(requiredAgents * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          callTrend: Math.round(callTrend * 10) / 10,
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
  
  // Transpose the data: create rows for each metric type
  const metricTypes = [
    { key: 'actual', label: 'Actual Agents', format: 'number' },
    { key: 'requirement', label: 'Required Agents', format: 'number' },
    { key: 'variance', label: 'Variance', format: 'number' },
    { key: 'callTrend', label: 'Call Trend (%)', format: 'percentage' },
    { key: 'aht', label: 'AHT (min)', format: 'number' },
    { key: 'serviceLevel', label: 'Service Level (%)', format: 'percentage' },
    { key: 'occupancy', label: 'Occupancy (%)', format: 'percentage' },
    { key: 'influx', label: 'Influx (calls/hr)', format: 'number' },
    { key: 'agentDistributionRatio', label: 'Agent Ratio (%)', format: 'percentage' }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const getVarianceColor = (metricKey: string, value: number) => {
    if (metricKey === 'variance') {
      if (value > 0) return "text-green-600"; // Green for positive variance
      if (value < -2) return "text-red-600"; // Red for significant negative variance
      return "text-yellow-600"; // Yellow for slight negative variance
    }
    return "";
  };

  return (
    <div className="p-4">
        <div className="overflow-auto max-h-96">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-[-1px] bg-card z-10">
              <tr>
                <th className="border border-border p-1 text-left min-w-16 bg-[#475569] text-white font-medium text-xs sticky left-0 z-20">Metric</th>
                {metrics.map((metric, index) => (
                  <th key={index} className="border border-border p-1 text-center min-w-12 bg-[#475569] text-white font-medium text-xs">
                    {metric.time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricTypes.map((metricType, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/50">
                  <td className="border border-border p-1 font-medium bg-muted/20 text-xs sticky left-0 z-10">
                    {metricType.label}
                  </td>
                  {metrics.map((metric, colIndex) => {
                    const value = metric[metricType.key as keyof typeof metric] as number;
                    return (
                      <td 
                        key={colIndex} 
                        className={`border border-border p-1 text-center text-xs ${getVarianceColor(metricType.key, value)}`}
                      >
                        {metricType.format === 'percentage' ? 
                          formatValue(value, metricType.format) : 
                          value.toFixed(1)
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
}