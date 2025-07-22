
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Download, RotateCcw } from "lucide-react";
import { ConfigurationData } from "./ContactCenterApp";
import { DateRangePicker } from "./DateRangePicker";

import { ForecastVolumeTable } from "./ForecastVolumeTable";
import { AHTTable } from "./AHTTable";
import { EnhancedRosterGrid } from "./EnhancedRosterGrid";
import { StaffingChart } from "./StaffingChart";

interface InputConfigurationScreenProps {
  onRunSimulation: (data: ConfigurationData) => void;
}

export function InputConfigurationScreen({ onRunSimulation }: InputConfigurationScreenProps) {
  const [weeks, setWeeks] = useState<4 | 8 | 12>(4);
  const [fromDate, setFromDate] = useState("2025-06-29");
  const [toDate, setToDate] = useState("2025-07-26");
  const [plannedAHT, setPlannedAHT] = useState(1560);
  const [slaTarget, setSlaTarget] = useState(80);
  const [serviceTime, setServiceTime] = useState(30);
  const [inOfficeShrinkage, setInOfficeShrinkage] = useState(0);
  const [outOfOfficeShrinkage, setOutOfOfficeShrinkage] = useState(34.88);
  const [billableBreak, setBillableBreak] = useState(5.88);
  const [volumeMatrix, setVolumeMatrix] = useState<number[][]>([]);
  const [ahtMatrix, setAHTMatrix] = useState<number[][]>([]);
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
    setVolumeMatrix([]);
    setAHTMatrix([]);
    setRosterGrid([]);
  };

  const calculateDateRange = (selectedWeeks: 4 | 8 | 12) => {
    const from = new Date(fromDate);
    const to = new Date(from);
    to.setDate(to.getDate() + (selectedWeeks * 7) - 1);
    setToDate(to.toISOString().split('T')[0]);
    setWeeks(selectedWeeks);
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
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Configuration Parameters</CardTitle>
          <p className="text-sm text-muted-foreground">
            LOB: Phone | Reference Range: {fromDate} to {toDate} | {weeks * 7} days ({weeks} weeks)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label>Date Range</Label>
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
              >
                4 Weeks
              </Button>
              <Button
                variant={weeks === 8 ? "default" : "outline"}
                size="sm"
                onClick={() => calculateDateRange(8)}
              >
                8 Weeks
              </Button>
              <Button
                variant={weeks === 12 ? "default" : "outline"}
                size="sm"
                onClick={() => calculateDateRange(12)}
              >
                12 Weeks
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear All
              </Button>
            </div>
            
            <div>
              <Label htmlFor="planned-aht">Planned AHT (seconds)</Label>
              <Input
                id="planned-aht"
                type="number"
                value={plannedAHT}
                onChange={(e) => setPlannedAHT(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sla-target">SLA Target (%)</Label>
              <Input
                id="sla-target"
                type="number"
                value={slaTarget}
                onChange={(e) => setSlaTarget(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="service-time">Service Time (seconds)</Label>
              <Input
                id="service-time"
                type="number"
                value={serviceTime}
                onChange={(e) => setServiceTime(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div></div>
            
            <div>
              <Label htmlFor="in-office-shrinkage">In-Office Shrinkage (%)</Label>
              <Input
                id="in-office-shrinkage"
                type="number"
                value={inOfficeShrinkage}
                onChange={(e) => setInOfficeShrinkage(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="out-office-shrinkage">Out-of-Office Shrinkage (%)</Label>
              <Input
                id="out-office-shrinkage"
                type="number"
                value={outOfOfficeShrinkage}
                onChange={(e) => setOutOfOfficeShrinkage(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="billable-break">Billable Break (%)</Label>
              <Input
                id="billable-break"
                type="number"
                value={billableBreak}
                onChange={(e) => setBillableBreak(Number(e.target.value))}
                className="mt-1"
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

      {/* Enhanced Roster Grid */}
      <EnhancedRosterGrid
        rosterGrid={rosterGrid}
        onRosterGridChange={setRosterGrid}
      />

      {/* Forecast Volume Table */}
      <ForecastVolumeTable
        volumeMatrix={volumeMatrix}
        onVolumeMatrixChange={setVolumeMatrix}
        weeks={weeks}
        fromDate={fromDate}
        toDate={toDate}
      />

      {/* AHT Table */}
      <AHTTable
        ahtMatrix={ahtMatrix}
        onAHTMatrixChange={setAHTMatrix}
        weeks={weeks}
        fromDate={fromDate}
        toDate={toDate}
      />
    </div>
  );
}
