import { useState } from "react";
import { InputConfigurationScreen } from "./InputConfigurationScreen";
import { OutputDashboard } from "./OutputDashboard";
import {
  calculateEffectiveVolume,
  calculateRequiredAgents,
  calculateVariance,
  calculateSLA,
  calculateOccupancy,
  calculateInflux,
  calculateAgentDistributionRatio,
  erlangAgents,
  erlangUtilization
} from "@/lib/erlang";

export type ConfigurationData = {
  // Date range
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
  
  // Configuration parameters
  plannedAHT: number;
  slaTarget: number;
  serviceTime: number;
  inOfficeShrinkage: number;
  outOfOfficeShrinkage: number;
  billableBreak: number;
  
  // Volume matrix (48 intervals × days)
  volumeMatrix: number[][];
  
  // Roster grid (agents × 48 intervals)
  rosterGrid: string[][];
};

export type SimulationResults = {
  finalSLA: number;
  finalOccupancy: number;
  totalVolume: number;
  averageStaffing: number;
  intervalResults: IntervalResult[];
  dailyResults: DailyResult[];
};

export type IntervalResult = {
  interval: string;
  volume: number;
  required: number;
  actual: number;
  sla: number;
  occupancy: number;
  variance: number;
};

export type DailyResult = {
  date: string;
  totalVolume: number;
  avgSLA: number;
  occupancy: number;
  avgStaffing: number;
};

export function ContactCenterApp() {
  const [currentScreen, setCurrentScreen] = useState<'input' | 'output'>('input');
  const [configData, setConfigData] = useState<ConfigurationData | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);

  const handleRunSimulation = (data: ConfigurationData) => {
    setConfigData(data);
    
    // Run simulation calculations here
    const simulationResults = calculateSimulation(data);
    setResults(simulationResults);
    
    setCurrentScreen('output');
  };

  const handleBackToInput = () => {
    setCurrentScreen('input');
  };

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'input' ? (
        <InputConfigurationScreen onRunSimulation={handleRunSimulation} />
      ) : (
        <OutputDashboard 
          results={results!} 
          onBackToInput={handleBackToInput}
          configData={configData!}
        />
      )}
    </div>
  );
}

function calculateSimulation(data: ConfigurationData): SimulationResults {
  
  const intervalResults: IntervalResult[] = [];
  const dailyResults: DailyResult[] = [];
  const totalDays = data.weeks * 7;
  
  // Calculate total agents across all intervals
  const totalAgents = data.rosterGrid.reduce((total, row) => {
    return total + row.reduce((rowSum, val) => rowSum + (parseInt(val) || 0), 0);
  }, 0) || 1;
  
  let totalVolumeAll = 0;
  let totalSLAWeighted = 0;
  let totalOccupancyWeighted = 0;
  let totalStaffingAll = 0;
  
  // Process each 30-minute interval with exact Excel calculations (12:30 AM to 12:00 AM)
  for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
    // Excel starts at 12:30 AM (0:30), so we add 30 minutes to the base calculation
    const totalMinutes = (intervalIndex * 30) + 30; // Start from 30 minutes (12:30 AM)
    const hour = Math.floor(totalMinutes / 60) % 24; // Wrap around at 24 hours
    const minute = totalMinutes % 60;
    const interval = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Calculate totals across all days for this interval
    let totalVolume = 0;
    let totalAHT = 0;
    let validDays = 0;
    
    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const volume = data.volumeMatrix[dayIndex]?.[intervalIndex] || 0;
      const aht = data.plannedAHT; // Use planned AHT as default
      
      if (volume > 0) {
        totalVolume += volume;
        totalAHT += aht;
        validDays++;
      }
    }
    
    const avgAHT = validDays > 0 ? totalAHT / validDays : data.plannedAHT;
    
    // Get rostered agents for this interval
    const rosteredAgents = data.rosterGrid[intervalIndex] ? 
      data.rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
    
    // EXACT EXCEL SMORT CALCULATIONS:
    
    // 1. Effective Volume (BA7): ((SUM(D7:AY7)*(1-$BA$1))*(1-$BB$1))*(1-$AZ$1)
    const effectiveVolume = calculateEffectiveVolume(
      totalVolume,
      data.outOfOfficeShrinkage,
      data.inOfficeShrinkage,
      data.billableBreak
    );
    
    // 2. Required Agents (BB7): IF(BD7<=0,0,Agents($A$1,$B$1,BD7*2,BE7))
    const trafficIntensity = (effectiveVolume * avgAHT) / 3600;
    const requiredAgents = effectiveVolume > 0 ? 
      erlangAgents(data.slaTarget / 100, data.serviceTime, trafficIntensity, avgAHT) : 0;
    
    // 3. Variance (BC7): Actual - Required
    const variance = calculateVariance(rosteredAgents, requiredAgents);
    
    // 4. Service Level (BF7): SLA(BA7,$B$1,BD7*2,BE7) - Erlang-C SLA
    const sla = rosteredAgents > 0 ? 
      calculateSLA(effectiveVolume, avgAHT, data.serviceTime, rosteredAgents) * 100 : 0;
    
    // 5. Occupancy (BG7): Utilisation(BA7,BD7*2,BE7) - Erlang utilization
    const occupancy = rosteredAgents > 0 ? 
      erlangUtilization(trafficIntensity, rosteredAgents) * 100 : 0;
    
    if (totalVolume > 0 || rosteredAgents > 0) {
      intervalResults.push({
        interval,
        volume: Math.round(effectiveVolume),
        required: Math.round(requiredAgents * 10) / 10,
        actual: rosteredAgents,
        sla: Math.round(sla * 10) / 10,
        occupancy: Math.round(occupancy * 10) / 10,
        variance: Math.round(variance * 10) / 10
      });
      
      // Accumulate for overall metrics
      totalVolumeAll += effectiveVolume;
      totalSLAWeighted += sla * effectiveVolume;
      totalOccupancyWeighted += occupancy * rosteredAgents;
      totalStaffingAll += rosteredAgents;
    }
  }
  
  // Calculate daily results
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const date = new Date(data.fromDate);
    date.setDate(date.getDate() + dayIndex);
    
    let dayVolume = 0;
    let dayStaffing = 0;
    let daySLAWeighted = 0;
    let dayOccupancyWeighted = 0;
    
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      const volume = data.volumeMatrix[dayIndex]?.[intervalIndex] || 0;
      const rosteredAgents = data.rosterGrid[intervalIndex] ? 
        data.rosterGrid[intervalIndex].reduce((sum, value) => sum + (parseInt(value) || 0), 0) : 0;
      
      const effectiveVolume = calculateEffectiveVolume(
        volume,
        data.outOfOfficeShrinkage,
        data.inOfficeShrinkage,
        data.billableBreak
      );
      
      const sla = calculateSLA(
        effectiveVolume,
        data.plannedAHT,
        data.serviceTime,
        rosteredAgents
      ) * 100;
      
      const occupancy = calculateOccupancy(
        effectiveVolume,
        data.plannedAHT,
        rosteredAgents,
        0.5
      );
      
      dayVolume += effectiveVolume;
      dayStaffing += rosteredAgents;
      daySLAWeighted += sla * effectiveVolume;
      dayOccupancyWeighted += occupancy * rosteredAgents;
    }
    
    dailyResults.push({
      date: date.toISOString().split('T')[0],
      totalVolume: Math.round(dayVolume),
      avgSLA: dayVolume > 0 ? Math.round((daySLAWeighted / dayVolume) * 10) / 10 : 0,
      occupancy: dayStaffing > 0 ? Math.round((dayOccupancyWeighted / dayStaffing) * 10) / 10 : 0,
      avgStaffing: Math.round(dayStaffing / 48 * 10) / 10
    });
  }
  
  // Calculate final metrics
  const finalSLA = totalVolumeAll > 0 ? totalSLAWeighted / totalVolumeAll : 0;
  const finalOccupancy = totalStaffingAll > 0 ? totalOccupancyWeighted / totalStaffingAll : 0;
  const averageStaffing = intervalResults.length > 0 ? totalStaffingAll / intervalResults.length : 0;
  
  return {
    finalSLA: Math.round(finalSLA * 10) / 10,
    finalOccupancy: Math.round(finalOccupancy * 10) / 10,
    totalVolume: Math.round(totalVolumeAll),
    averageStaffing: Math.round(averageStaffing * 10) / 10,
    intervalResults,
    dailyResults
  };
}
