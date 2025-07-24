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

  const calculateMetrics = () => {
    const metrics = [];
    const totalDays = weeks * 7;

    const totalAgents = rosterGrid.reduce((total, row) => {
      return total + row.reduce((rowSum, val) => rowSum + (parseInt(val) || 0), 0);
    }, 0) || 1;

    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      const totalMinutes = intervalIndex * 30; // Start from 00:00
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = totalMinutes % 60;

      const timeDisplay = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

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

      const rawRosteredAgents = rosterGrid[intervalIndex] ?
        rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;

      const rosteredAgents = rawRosteredAgents *
        (1 - configData.outOfOfficeShrinkage / 100) *
        (1 - configData.inOfficeShrinkage / 100) *
        (1 - configData.billableBreak / 100);

      const effectiveVolume = calculateEffectiveVolume(
        totalVolume,
        configData.outOfOfficeShrinkage,
        configData.inOfficeShrinkage,
        configData.billableBreak
      );

      // Fixed required agents calculation
      // Basic staffing calculation using raw volume (no double shrinkage)
      const rawStaffHours = calculateStaffHours(totalVolume, avgAHT);
      const agentWorkHours = calculateAgentWorkHours(
        0.5, // 30-minute interval
        configData.outOfOfficeShrinkage,
        configData.inOfficeShrinkage,
        configData.billableBreak
      );

      // Basic requirement: Raw staff hours / adjusted agent work hours
      const basicRequiredAgents = agentWorkHours > 0 ? rawStaffHours / agentWorkHours : 0;

      // Erlang-C calculation uses effective volume for traffic intensity
      const trafficIntensity = (effectiveVolume * avgAHT) / 3600;
      const erlangRequiredAgents = effectiveVolume > 0 ?
        erlangAgents(configData.slaTarget / 100, configData.serviceTime, trafficIntensity, avgAHT) : 0;

      // Use basic calculation as primary, Erlang-C as validation for SLA
      const requiredAgents = basicRequiredAgents;

      const variance = calculateVariance(rosteredAgents, requiredAgents);
      // Call trend: shows shrinkage impact
      const callTrend = calculateCallTrendShrinkage(effectiveVolume, totalVolume);

      // Service level based on effective volume and rostered agents
      const serviceLevel = rosteredAgents > 0 ?
        calculateSLA(effectiveVolume, avgAHT, configData.serviceTime, rosteredAgents) * 100 : 0;

      // Occupancy: traffic intensity vs available agents
      const occupancy = rosteredAgents > 0 ?
        (trafficIntensity / rosteredAgents) * 100 : 0;
      const influx = calculateInflux(effectiveVolume, 0.5);
      const agentDistributionRatio = calculateAgentDistributionRatio(rosteredAgents, totalAgents);

      if (totalVolume > 0 || rosteredAgents > 0) {
        metrics.push({
          time: timeDisplay,
          actual: Math.round(rosteredAgents * 10) / 10,
          requirement: Math.round(requiredAgents * 10) / 10,
          variance: Math.round(variance * 10) / 10,
          callTrend: Math.round(callTrend * 10) / 10,
          aht: Math.round(avgAHT / 60 * 10) / 10,
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
            basicRequiredAgents,
            erlangRequiredAgents,
            rosteredAgents,
            rawRosteredAgents,
            totalAgents,
            serviceLevel,
            occupancy,
            influx,
            agentDistributionRatio,
            variance,
            rawStaffHours,
            agentWorkHours,
            outOfOfficeShrinkage: configData.outOfOfficeShrinkage,
            inOfficeShrinkage: configData.inOfficeShrinkage,
            billableBreak: configData.billableBreak
          }
        });
      }
    }

    return metrics;
  };

  const metrics = calculateMetrics();

  const metricTypes = [
    { key: 'actual', label: 'Actual', format: 'number' },
    { key: 'requirement', label: 'Requirement', format: 'number' },
    { key: 'variance', label: 'Variance', format: 'number' },
    { key: 'callTrend', label: 'Call Trend', format: 'percentage' },
    { key: 'aht', label: 'AHT (min)', format: 'time' },
    { key: 'serviceLevel', label: 'Service Level', format: 'percentage' },
    { key: 'occupancy', label: 'Occupancy', format: 'percentage' },
    { key: 'influx', label: 'Influx', format: 'number' },
    { key: 'agentDistributionRatio', label: 'Ratio', format: 'percentage' }
  ];

  const formatValue = (value: number, type: string) => {
    const roundedValue = Math.round(value);
    switch (type) {
      case 'percentage':
        return `${roundedValue}%`;
      case 'time':
        return `${roundedValue} min`;
      default:
        return roundedValue.toString();
    }
  };

  const getVarianceColor = (metricKey: string, value: number) => {
    if (metricKey === 'variance') {
      if (value > 0) return "text-chart-2";
      if (value < -2) return "text-chart-1";
      return "text-chart-4";
    }
    return "";
  };

  const getVarianceIcon = (metricKey: string, value: number) => {
    if (metricKey === 'variance') {
      if (value > 0) return <TrendingUp className="h-3 w-3 inline ml-1" />;
      if (value < 0) return <TrendingDown className="h-3 w-3 inline ml-1" />;
    }
    return null;
  };

  const renderTooltipContent = (metric: any, metricTypeKey: string) => {
    const { raw, ...displayMetrics } = metric;
    const value = displayMetrics[metricTypeKey];
    switch (metricTypeKey) {
      case 'actual':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Actual Agents Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Actual = Raw Agents Ã— (1 - OOO Shrinkage) Ã— (1 - IO Shrinkage) Ã— (1 - Billable Break)
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Raw Agents = {raw.rawRosteredAgents.toFixed(2)}</div>
              <div>OOO Shrinkage = {configData.outOfOfficeShrinkage}%</div>
              <div>IO Shrinkage = {configData.inOfficeShrinkage}%</div>
              <div>Billable Break = {configData.billableBreak}%</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {raw.rosteredAgents.toFixed(2)}</div>
            </div>
          </div>
        );
      case 'requirement':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Requirement Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Required = (Total Volume × AHT ÷ 3600) ÷ (0.5 × (1-OOO) × (1-IO) × (1-BB))
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div className="font-medium">Step-by-step:</div>
              <div>1. Total Volume = {raw.totalVolume?.toFixed(2) || 'N/A'} calls</div>
              <div>2. AHT = {raw.avgAHT?.toFixed(2) || 'N/A'} seconds</div>
              <div>3. Raw Staff Hours = {raw.totalVolume?.toFixed(2) || 'N/A'} × {raw.avgAHT?.toFixed(2) || 'N/A'} ÷ 3600 = {raw.rawStaffHours?.toFixed(2) || 'N/A'}</div>
              <div>4. Shrinkage Factors:</div>
              <div>   - Out of Office: {raw.outOfOfficeShrinkage || 'N/A'}% = {((100 - (raw.outOfOfficeShrinkage || 0))/100).toFixed(2)}</div>
              <div>   - In Office: {raw.inOfficeShrinkage || 'N/A'}% = {((100 - (raw.inOfficeShrinkage || 0))/100).toFixed(2)}</div>
              <div>   - Billable Break: {raw.billableBreak || 'N/A'}% = {((100 - (raw.billableBreak || 0))/100).toFixed(2)}</div>
              <div>5. Agent Work Hours = 0.5 × {((100 - (raw.outOfOfficeShrinkage || 0))/100).toFixed(2)} × {((100 - (raw.inOfficeShrinkage || 0))/100).toFixed(2)} × {((100 - (raw.billableBreak || 0))/100).toFixed(2)} = {raw.agentWorkHours?.toFixed(2) || 'N/A'}</div>
              <div className="font-medium mt-2">Final Calculation:</div>
              <div>Required = {raw.rawStaffHours?.toFixed(2) || 'N/A'} ÷ {raw.agentWorkHours?.toFixed(2) || 'N/A'} = {value}</div>
            </div>
          </div>
        );
      case 'variance':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Variance Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Variance = Actual Agents - Required Agents
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Actual Agents = {raw.rosteredAgents.toFixed(2)}</div>
              <div>Required Agents = {raw.requiredAgents.toFixed(2)}</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {value}</div>
            </div>
          </div>
        );
      case 'callTrend':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Call Trend Calculation (Shrinkage Impact)</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Trend = (Effective Volume ÷ Total Volume) × 100
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div className="font-medium">Step-by-step:</div>
              <div>1. Total Volume = {raw.totalVolume?.toFixed(2) || 'N/A'} calls</div>
              <div>2. Shrinkage Factors Applied:</div>
              <div>   - Out of Office: {raw.outOfOfficeShrinkage || 'N/A'}%</div>
              <div>   - In Office: {raw.inOfficeShrinkage || 'N/A'}%</div>
              <div>   - Billable Break: {raw.billableBreak || 'N/A'}%</div>
              <div>3. Effective Volume = {raw.totalVolume?.toFixed(2) || 'N/A'} × {((100 - (raw.outOfOfficeShrinkage || 0))/100).toFixed(2)} × {((100 - (raw.inOfficeShrinkage || 0))/100).toFixed(2)} × {((100 - (raw.billableBreak || 0))/100).toFixed(2)} = {raw.effectiveVolume?.toFixed(2) || 'N/A'}</div>
              <div className="font-medium mt-2">Final Calculation:</div>
              <div>Call Trend = ({raw.effectiveVolume?.toFixed(2) || 'N/A'} ÷ {raw.totalVolume?.toFixed(2) || 'N/A'}) × 100 = {value}%</div>
              <div className="text-xs mt-1 italic">Shows how much effective capacity remains after shrinkage</div>
            </div>
          </div>
        );
      case 'aht':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">AHT Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              AHT = (Total AHT / Valid Days) / 60
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Total AHT = {raw.avgAHT.toFixed(2)}s</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {value} min</div>
            </div>
          </div>
        );
      case 'serviceLevel':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Service Level Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              SLA = calculateSLA(Volume, AHT, Service Time, Agents)
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Effective Volume = {raw.effectiveVolume.toFixed(2)}</div>
              <div>AHT = {raw.avgAHT.toFixed(2)}s</div>
              <div>Service Time = {configData.serviceTime}s</div>
              <div>Actual Agents = {raw.rosteredAgents.toFixed(2)}</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {value}%</div>
            </div>
          </div>
        );
      case 'occupancy':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Occupancy Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Occupancy = (Traffic Intensity ÷ Actual Agents) × 100
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div className="font-medium">Step-by-step:</div>
              <div>1. Effective Volume = {raw.effectiveVolume?.toFixed(2) || 'N/A'} calls</div>
              <div>2. AHT = {raw.avgAHT?.toFixed(2) || 'N/A'} seconds</div>
              <div>3. Traffic Intensity = {raw.effectiveVolume?.toFixed(2) || 'N/A'} × {raw.avgAHT?.toFixed(2) || 'N/A'} ÷ 3600 = {raw.trafficIntensity?.toFixed(2) || 'N/A'} Erlangs</div>
              <div>4. Actual Agents = {raw.rosteredAgents?.toFixed(2) || 'N/A'}</div>
              <div className="font-medium mt-2">Final Calculation:</div>
              <div>Occupancy = ({raw.trafficIntensity?.toFixed(2) || 'N/A'} ÷ {raw.rosteredAgents?.toFixed(2) || 'N/A'}) × 100 = {value}%</div>
            </div>
          </div>
        );
      case 'influx':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Influx Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Influx = Effective Volume / 0.5
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Effective Volume = {raw.effectiveVolume.toFixed(2)}</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {value}</div>
            </div>
          </div>
        );
      case 'agentDistributionRatio':
        return (
          <div className="text-sm">
            <div className="font-semibold mb-1">Agent Ratio Calculation</div>
            <code className="block bg-muted p-1 rounded mb-2 text-xs">
              Ratio = (Actual Agents / Total Agents) * 100
            </code>
            <div className="text-xs space-y-1 mt-2">
              <div>Actual Agents = {raw.rosteredAgents.toFixed(2)}</div>
              <div>Total Agents = {raw.totalAgents.toFixed(2)}</div>
              <div className="font-medium mt-2">Calculation:</div>
              <div>= {value}%</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-[-1px] bg-card z-10">
        <tr>
          <th className="border border-border p-2 text-left min-w-28 bg-[#475569]  text-white font-medium sticky left-0 z-20" style={{ minWidth: '112px' }}>Metric</th>
          {metrics.map((metric, index) => (
            <th key={index} className="border border-border p-2 text-center bg-[#475569]  text-white font-medium" style={{ width: '50px' }}>
              {metric.time}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {metricTypes.map((metricType, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-muted/50">
            <td className="border border-border p-2 font-medium bg-[#475569]  text-white sticky left-0 z-10" style={{ minWidth: '112px' }}>
              {metricType.label}
            </td>
            {metrics.map((metric, colIndex) => {
              const value = metric[metricType.key as keyof typeof metric] as number;
              return (
                <td
                  key={colIndex}
                  className={`border border-border p-2 text-center ${getVarianceColor(metricType.key, value)}`}
                  style={{ width: '50px' }}
                >
                  <Tooltip>
                    <TooltipTrigger>
                      <span>
                        {formatValue(value, metricType.format)}
                        {getVarianceIcon(metricType.key, value)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[350px]">
                      {renderTooltipContent(metric, metricType.key)}
                    </TooltipContent>
                  </Tooltip>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
