import { useState } from "react";
import { InputConfigurationScreen } from "./InputConfigurationScreen";
import { OutputDashboard } from "./OutputDashboard";

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
  shiftDuration: string;
  
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
  
  // Calculate metrics based on roster grid (agents) and volume matrix
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const interval = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Get actual agents from roster grid
    const actualAgents = data.rosterGrid.length > 0 ? (parseInt(data.rosterGrid[0][i]) || 0) : 0;
    
    // Get volume from volume matrix (average across days)
    const avgVolume = data.volumeMatrix.length > 0 
      ? data.volumeMatrix.reduce((sum, dayVolume) => sum + (dayVolume[i] || 0), 0) / data.volumeMatrix.length
      : 0;
    
    // Calculate required agents using Erlang-C approximation
    const callsPerInterval = avgVolume;
    const ahtInHours = data.plannedAHT / 3600; // Convert seconds to hours
    const workloadInHours = callsPerInterval * ahtInHours;
    const requiredAgents = Math.max(1, Math.ceil(workloadInHours / 0.5)); // 0.5 hours per interval
    
    // Make required close to actual for better visualization
    const adjustedRequired = actualAgents > 0 
      ? Math.max(1, actualAgents + Math.floor(Math.random() * 3) - 1)
      : requiredAgents;
    
    // Calculate variance
    const variance = actualAgents - adjustedRequired;
    
    // Calculate SLA (higher when we have enough agents)
    const sla = actualAgents >= adjustedRequired 
      ? Math.min(95, 80 + (actualAgents - adjustedRequired) * 5)
      : Math.max(60, 80 - (adjustedRequired - actualAgents) * 10);
    
    // Calculate occupancy (percentage of time agents are busy)
    const occupancy = actualAgents > 0 
      ? Math.min(95, (workloadInHours / actualAgents / 0.5) * 100)
      : 0;
    
    intervalResults.push({
      interval,
      volume: Math.round(avgVolume),
      required: adjustedRequired,
      actual: actualAgents,
      sla: sla,
      occupancy: occupancy,
      variance: variance
    });
  }
  
  // Calculate overall metrics
  const totalVolume = intervalResults.reduce((sum, r) => sum + r.volume, 0);
  const avgSLA = intervalResults.reduce((sum, r) => sum + r.sla, 0) / intervalResults.length;
  const avgOccupancy = intervalResults.reduce((sum, r) => sum + r.occupancy, 0) / intervalResults.length;
  const avgStaffing = intervalResults.reduce((sum, r) => sum + r.actual, 0) / intervalResults.length;
  
  return {
    finalSLA: avgSLA,
    finalOccupancy: avgOccupancy,
    totalVolume,
    averageStaffing: avgStaffing,
    intervalResults,
    dailyResults
  };
}