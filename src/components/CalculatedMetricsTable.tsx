import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  calculateCallTrend,
  calculateCallTrendShrinkage,
  calculateStaffHours,
  calculateAgentWorkHours
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
          actual: rosteredAgents,
          requirement: Math.round(requiredAgents * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          callTrend,
          aht: Math.round(avgAHT / 60 * 10) / 10, // Convert to minutes with 1 decimal
          serviceLevel: Math.round(serviceLevel * 10) / 10,
          occupancy: Math.round(occupancy * 10) / 10,
          influx: Math.round(influx),
          agentDistributionRatio: Math.round(agentDistributionRatio * 10) / 10,
          raw: {
            totalVolume,
            effectiveVolume,
            avgAHT,
            trafficIntensity,
            requiredAgents,
            rosteredAgents,
            rawRosteredAgents,
            totalAgents,
            serviceLevel,
            occupancy,
            influx,
            agentDistributionRatio,
            variance
          }
        });
      }
    }
    
    return metrics;
  };

  const metrics = calculateMetrics();

  const formatValue = (value: number, type: string) => {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
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
            <thead className="sticky top-[-1px] bg-card z-10">
              <tr>
                <th className="border border-border p-2 text-left min-w-20 bg-[#475569]  font-medium">Time</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569]  font-medium">Actual</th>
                <th className="border border-border p-2 text-center min-w-20 bg-[#475569]  font-medium">Requirement</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569]  font-medium">Variance</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569] font-medium">Call Trend</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569] font-medium">AHT</th>
                <th className="border border-border p-2 text-center min-w-20 bg-[#475569] font-medium">Service Level</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569]  font-medium">Occupancy</th>
                <th className="border border-border p-2 text-center min-w-16 bg-[#475569] font-medium">Influx</th>
                <th className="border border-border p-2 text-center min-w-20 bg-[#475569]  font-medium">Agent Ratio</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="border border-border p-2 font-medium bg-muted/20">{metric.time}</td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>
                        {Math.round(metric.actual)}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Actual Agents Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Actual = Raw Agents Ã— (1 - OutOfOfficeShrinkage) Ã— (1 - InOfficeShrinkage) Ã— (1 - BillableBreak)
                          </code>
                          
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Raw Agents = {(metric.actual / 
                              ((1 - configData.outOfOfficeShrinkage/100) * 
                              (1 - configData.inOfficeShrinkage/100) * 
                              (1 - configData.billableBreak/100))).toFixed(2)}</div>
                            <div>OutOfOfficeShrinkage = {configData.outOfOfficeShrinkage}% ({(configData.outOfOfficeShrinkage/100).toFixed(2)})</div>
                            <div>InOfficeShrinkage = {configData.inOfficeShrinkage}% ({(configData.inOfficeShrinkage/100).toFixed(2)})</div>
                            <div>BillableBreak = {configData.billableBreak}% ({(configData.billableBreak/100).toFixed(2)})</div>
                            
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>
                              {(metric.actual / 
                                ((1 - configData.outOfOfficeShrinkage/100) * 
                                (1 - configData.inOfficeShrinkage/100) * 
                                (1 - configData.billableBreak/100))).toFixed(2)}
                              Ã— {(1 - configData.outOfOfficeShrinkage/100).toFixed(2)} 
                              Ã— {(1 - configData.inOfficeShrinkage/100).toFixed(2)} 
                              Ã— {(1 - configData.billableBreak/100).toFixed(2)}
                            </div>
                            <div>
                              = {(metric.actual / 
                                ((1 - configData.outOfOfficeShrinkage/100) * 
                                (1 - configData.inOfficeShrinkage/100) * 
                                (1 - configData.billableBreak/100))).toFixed(2)}
                              Ã— {(1 - configData.outOfOfficeShrinkage/100).toFixed(2)} 
                              Ã— {(1 - configData.inOfficeShrinkage/100).toFixed(2)} 
                              Ã— {(1 - configData.billableBreak/100).toFixed(2)}
                            </div>
                            <div>= {metric.actual.toFixed(2)}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{metric.requirement}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Requirement Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Required = erlangAgents(SLA Target, Service Time, Traffic Intensity, AHT)
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>SLA Target = {configData.slaTarget}%</div>
                            <div>Service Time = {configData.serviceTime}s</div>
                            <div>Traffic Intensity = {metric.raw.trafficIntensity.toFixed(2)} Erlangs</div>
                            <div>AHT = {metric.raw.avgAHT.toFixed(2)}s</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= erlangAgents({(configData.slaTarget / 100)}, {configData.serviceTime}, {metric.raw.trafficIntensity.toFixed(2)}, {metric.raw.avgAHT.toFixed(2)})</div>
                            <div>= {metric.requirement}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className={`border border-border p-2 text-center ${getVarianceColor(metric.variance)}`}>
                    <Tooltip>
                      <TooltipTrigger>
                        {metric.variance}
                        {getVarianceIcon(metric.variance)}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Variance Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Variance = Actual Agents - Required Agents
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Actual Agents = {metric.actual.toFixed(2)}</div>
                            <div>Required Agents = {metric.requirement}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= {metric.actual.toFixed(2)} - {metric.requirement}</div>
                            <div>= {metric.variance}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{formatValue(metric.callTrend, 'percentage')}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Call Trend Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Call Trend = (Effective Volume / Total Volume) * 100
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Effective Volume = {metric.raw.effectiveVolume.toFixed(2)}</div>
                            <div>Total Volume = {metric.raw.totalVolume.toFixed(2)}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= ({metric.raw.effectiveVolume.toFixed(2)} / {metric.raw.totalVolume.toFixed(2)}) * 100</div>
                            <div>= {metric.callTrend.toFixed(1)}%</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{metric.aht} min</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">AHT Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            AHT = (Total AHT / Valid Days) / 60
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Total AHT = {metric.raw.avgAHT.toFixed(2)}s</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= {metric.raw.avgAHT.toFixed(2)} / 60</div>
                            <div>= {metric.aht} min</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{formatValue(metric.serviceLevel, 'percentage')}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Service Level Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            SLA = calculateSLA(Effective Volume, AHT, Service Time, Actual Agents)
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Effective Volume = {metric.raw.effectiveVolume.toFixed(2)}</div>
                            <div>AHT = {metric.raw.avgAHT.toFixed(2)}s</div>
                            <div>Service Time = {configData.serviceTime}s</div>
                            <div>Actual Agents = {metric.actual.toFixed(2)}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= calculateSLA({metric.raw.effectiveVolume.toFixed(2)}, {metric.raw.avgAHT.toFixed(2)}, {configData.serviceTime}, {metric.actual.toFixed(2)}) * 100</div>
                            <div>= {metric.serviceLevel.toFixed(1)}%</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{formatValue(metric.occupancy, 'percentage')}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Occupancy Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Occupancy = erlangUtilization(Traffic Intensity, Actual Agents)
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Traffic Intensity = {metric.raw.trafficIntensity.toFixed(2)} Erlangs</div>
                            <div>Actual Agents = {metric.actual.toFixed(2)}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= erlangUtilization({metric.raw.trafficIntensity.toFixed(2)}, {metric.actual.toFixed(2)}) * 100</div>
                            <div>= {metric.occupancy.toFixed(1)}%</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{metric.influx}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Influx Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Influx = Effective Volume / 0.5
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Effective Volume = {metric.raw.effectiveVolume.toFixed(2)}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= {metric.raw.effectiveVolume.toFixed(2)} / 0.5</div>
                            <div>= {metric.influx}</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="border border-border p-2 text-center">
                    <Tooltip>
                      <TooltipTrigger>{formatValue(metric.agentDistributionRatio, 'percentage')}</TooltipTrigger>
                      <TooltipContent className="max-w-[350px]">
                        <div className="text-sm">
                          <div className="font-semibold mb-1">Agent Ratio Calculation</div>
                          <div className="mb-1">Formula:</div>
                          <code className="block bg-muted p-1 rounded mb-2">
                            Agent Ratio = (Actual Agents / Total Agents) * 100
                          </code>
                          <div className="text-xs space-y-1 mt-2">
                            <div className="font-medium">Values:</div>
                            <div>Actual Agents = {metric.actual.toFixed(2)}</div>
                            <div>Total Agents = {metric.raw.totalAgents.toFixed(2)}</div>
                            <div className="font-medium mt-2">Calculation:</div>
                            <div>= ({metric.actual.toFixed(2)} / {metric.raw.totalAgents.toFixed(2)}) * 100</div>
                            <div>= {metric.agentDistributionRatio.toFixed(1)}%</div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
