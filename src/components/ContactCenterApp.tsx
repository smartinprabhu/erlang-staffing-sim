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
  // Mock simulation results for now
  const intervalResults: IntervalResult[] = [];
  const dailyResults: DailyResult[] = [];
  
  // Generate mock data for 48 intervals
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const interval = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    intervalResults.push({
      interval,
      volume: Math.floor(Math.random() * 100) + 50,
      required: Math.floor(Math.random() * 20) + 10,
      actual: Math.floor(Math.random() * 25) + 8,
      sla: Math.random() * 40 + 60,
      occupancy: Math.random() * 30 + 70,
      variance: Math.floor(Math.random() * 10) - 5
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