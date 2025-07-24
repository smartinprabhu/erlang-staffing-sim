import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Download, RotateCcw } from "lucide-react";
import { ConfigurationData } from "./ContactCenterApp";
import { DateRangePicker } from "./DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ForecastVolumeTable } from "./ForecastVolumeTable";
import { AHTTable } from "./AHTTable";
import { EnhancedRosterGrid } from "./EnhancedRosterGrid";
import { StaffingChart } from "./StaffingChart";

export interface InputConfigurationScreenProps {
  onRunSimulation: (data: ConfigurationData) => void;
}

// Helper function to generate sample volume data
const generateSampleVolumeData = (totalDays: number): number[][] => {
  const matrix: number[][] = [];
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const dayVolumes: number[] = [];
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      // Sample volume pattern - higher during business hours
      const hour = Math.floor(((intervalIndex * 30) + 30) / 60) % 24;
      let baseVolume = 0;
      
      if (hour >= 8 && hour <= 18) {
        baseVolume = 8 + Math.floor(Math.random() * 6); // Business hours: 8-14 calls
      } else if (hour >= 6 && hour <= 22) {
        baseVolume = 3 + Math.floor(Math.random() * 4); // Extended hours: 3-7 calls
      } else {
        baseVolume = 1 + Math.floor(Math.random() * 2); // Night hours: 1-3 calls
      }
      
      dayVolumes.push(baseVolume);
    }
    matrix.push(dayVolumes);
  }
  return matrix;
};

// Helper function to generate sample AHT data
const generateSampleAHTData = (totalDays: number): number[][] => {
  const matrix: number[][] = [];
  
  for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
    const dayAHTs: number[] = [];
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      // Sample AHT pattern - varies slightly throughout the day
      const baseAHT = 1560; // 26 minutes base
      const variation = Math.floor(Math.random() * 300) - 150; // ±2.5 minutes
      dayAHTs.push(Math.max(60, baseAHT + variation)); // Minimum 1 minute
    }
    matrix.push(dayAHTs);
  }
  return matrix;
};

// Helper function to resize matrix when weeks change
const resizeMatrix = (existingMatrix: number[][], newTotalDays: number, generateSampleData: (days: number) => number[][]): number[][] => {
  const newMatrix: number[][] = [];
  
  for (let dayIndex = 0; dayIndex < newTotalDays; dayIndex++) {
    if (existingMatrix[dayIndex]) {
      // Keep existing data
      newMatrix.push([...existingMatrix[dayIndex]]);
    } else {
      // Generate new data for additional days
      const sampleData = generateSampleData(1);
      newMatrix.push(sampleData[0]);
    }
  }
  return newMatrix;
};

export function InputConfigurationScreen({ onRunSimulation }: InputConfigurationScreenProps) {
  const [weeks, setWeeks] = useState<4 | 8 | 12>(4);
  const [fromDate, setFromDate] = useState("2025-06-29");
  const [toDate, setToDate] = useState("2025-07-26");
  const [lob, setLob] = useState("Phone");
  const [plannedAHT, setPlannedAHT] = useState(1560);
  const [slaTarget, setSlaTarget] = useState(80);
  const [serviceTime, setServiceTime] = useState(30);
  const [inOfficeShrinkage, setInOfficeShrinkage] = useState(0);
  const [outOfOfficeShrinkage, setOutOfOfficeShrinkage] = useState(15);
  const [billableBreak, setBillableBreak] = useState(8);
  
  // Initialize with adjusted sample data immediately
  const [volumeMatrix, setVolumeMatrix] = useState<number[][]>(() => generateSampleVolumeData(4 * 7));
  const [ahtMatrix, setAHTMatrix] = useState<number[][]>(() => generateSampleAHTData(4 * 7));
  const [rosterGrid, setRosterGrid] = useState<string[][]>([]);

  const handleRunSimulation = () => {
    const configData: ConfigurationData = {
      weeks,
      fromDate,
      toDate,
      plannedAHT,
      slaTarget,
      serviceTime,
      inOfficeShrinkage,
      outOfOfficeShrinkage,
      billableBreak,
      volumeMatrix,
      rosterGrid
    };
    onRunSimulation(configData);
  };

  const handleClear = () => {
    // Reset to empty matrices
    setVolumeMatrix([]);
    setAHTMatrix([]);
    setRosterGrid([]);
  };

  const regenerateVolumeData = () => {
    // Regenerate volume data with new adjusted values
    const totalDays = weeks * 7;
    setVolumeMatrix(generateSampleVolumeData(totalDays));
    setAHTMatrix(generateSampleAHTData(totalDays));
  };

  const calculateDateRange = (selectedWeeks: 4 | 8 | 12) => {
    setWeeks(selectedWeeks);
    const startDate = new Date("2025-06-29");
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (selectedWeeks * 7) - 1);
    
    setFromDate(startDate.toISOString().split('T')[0]);
    setToDate(endDate.toISOString().split('T')[0]);
    
    // Update matrix sizes when weeks change
    const totalDays = selectedWeeks * 7;
    setVolumeMatrix(prev => resizeMatrix(prev, totalDays, generateSampleVolumeData));
    setAHTMatrix(prev => resizeMatrix(prev, totalDays, generateSampleAHTData));
  };

  const handleDateRangeChange = (newFromDate: string, newToDate: string) => {
    setFromDate(newFromDate);
    setToDate(newToDate);
    
    // Calculate weeks based on date difference
    const from = new Date(newFromDate);
    const to = new Date(newToDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const calculatedWeeks = Math.ceil(diffDays / 7);
    
    if (calculatedWeeks <= 4) {
      setWeeks(4);
    } else if (calculatedWeeks <= 8) {
      setWeeks(8);
    } else {
      setWeeks(12);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground"> Occupancy Modeling</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Compact Configuration Parameters */}
      <Card className="mb-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Configuration Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="lob" className="text-xs">LOB</Label>
              <Select value={lob} onValueChange={setLob}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue placeholder="Select LOB" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Chat">Chat</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs">Date Range</Label>
              <div className="mt-1">
                <DateRangePicker
                  fromDate={fromDate}
                  toDate={toDate}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant={weeks === 4 ? "default" : "outline"}
                size="sm"
                onClick={() => calculateDateRange(4)}
                className="text-xs"
              >
                4 Weeks
              </Button>
              <Button
                variant={weeks === 8 ? "default" : "outline"}
                size="sm"
                onClick={() => calculateDateRange(8)}
                className="text-xs"
              >
                8 Weeks
              </Button>
              <Button
                variant={weeks === 12 ? "default" : "outline"}
                size="sm"
                onClick={() => calculateDateRange(12)}
                className="text-xs"
              >
                12 Weeks
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={handleClear} className="gap-2 text-xs">
                <RotateCcw className="h-3 w-3" />
                Clear All
              </Button>
              <Button variant="outline" onClick={regenerateVolumeData} className="gap-2 text-xs">
                <Settings className="h-3 w-3" />
                Adjust Volumes
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            <div>
              <Label htmlFor="planned-aht" className="text-xs">Planned AHT (s)</Label>
              <Input
                id="planned-aht"
                type="number"
                value={plannedAHT}
                onChange={(e) => setPlannedAHT(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="sla-target" className="text-xs">SLA Target (%)</Label>
              <Input
                id="sla-target"
                type="number"
                value={slaTarget}
                onChange={(e) => setSlaTarget(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="service-time" className="text-xs">Service Time (s)</Label>
              <Input
                id="service-time"
                type="number"
                value={serviceTime}
                onChange={(e) => setServiceTime(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="in-office-shrinkage" className="text-xs">In-Office Shrinkage (%)</Label>
              <Input
                id="in-office-shrinkage"
                type="number"
                value={inOfficeShrinkage}
                onChange={(e) => setInOfficeShrinkage(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="out-office-shrinkage" className="text-xs">Out-of-Office Shrinkage (%)</Label>
              <Input
                id="out-office-shrinkage"
                type="number"
                value={outOfOfficeShrinkage}
                onChange={(e) => setOutOfOfficeShrinkage(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="billable-break" className="text-xs">Billable Break (%)</Label>
              <Input
                id="billable-break"
                type="number"
                value={billableBreak}
                onChange={(e) => setBillableBreak(Number(e.target.value))}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Live Staffing Chart */}
      <StaffingChart 
        volumeMatrix={volumeMatrix}
        ahtMatrix={ahtMatrix}
        rosterGrid={rosterGrid}
        onRosterGridChange={setRosterGrid}
        onRunSimulation={handleRunSimulation}
        configData={{
          weeks,
          fromDate,
          toDate,
          plannedAHT,
          slaTarget,
          serviceTime,
          inOfficeShrinkage,
          outOfOfficeShrinkage,
          billableBreak,
          volumeMatrix,
          rosterGrid
        }}
      />

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Roster Schedule Grid</TabsTrigger>
          <TabsTrigger value="volume">Forecast Volume</TabsTrigger>
          <TabsTrigger value="aht">AHT</TabsTrigger>
        </TabsList>
        <TabsContent value="roster">
          <EnhancedRosterGrid
            rosterGrid={rosterGrid}
            onRosterGridChange={setRosterGrid}
          />
        </TabsContent>
        <TabsContent value="volume">
          <ForecastVolumeTable
            volumeMatrix={volumeMatrix}
            onVolumeMatrixChange={setVolumeMatrix}
            weeks={weeks}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TabsContent>
        <TabsContent value="aht">
          <AHTTable
            ahtMatrix={ahtMatrix}
            onAHTMatrixChange={setAHTMatrix}
            weeks={weeks}
            fromDate={fromDate}
            toDate={toDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
