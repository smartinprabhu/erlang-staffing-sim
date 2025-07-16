import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Settings, Upload, Download, Play, RotateCcw } from "lucide-react";
import { ConfigurationData } from "./ContactCenterApp";
import { DateRangeSelector } from "./DateRangeSelector";
import { VolumeMatrixGrid } from "./VolumeMatrixGrid";
import { RosterGrid } from "./RosterGrid";
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
  const [shiftDuration, setShiftDuration] = useState("8.5 hours");
  const [volumeMatrix, setVolumeMatrix] = useState<number[][]>([]);
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
      shiftDuration,
      volumeMatrix,
      rosterGrid
    };
    
    onRunSimulation(configData);
  };

  const handleClear = () => {
    setVolumeMatrix([]);
    setRosterGrid([]);
  };

  const handleLoadSample = () => {
    // Load sample data
    const sampleVolume = Array(28).fill(0).map(() => 
      Array(48).fill(0).map(() => Math.floor(Math.random() * 100) + 20)
    );
    const sampleRoster = Array(30).fill(0).map(() => 
      Array(48).fill("")
    );
    
    setVolumeMatrix(sampleVolume);
    setRosterGrid(sampleRoster);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Contact Center Occupancy Modeling</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Input Configuration
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Output Dashboard
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector 
        weeks={weeks}
        fromDate={fromDate}
        toDate={toDate}
        onWeeksChange={setWeeks}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      {/* Configuration Parameters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Configuration Parameters</CardTitle>
          <p className="text-sm text-muted-foreground">
            LOB: Contact Center | Forecast Range: {fromDate} to {toDate} | {weeks * 7} days ({weeks} weeks)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div>
              <Label htmlFor="shift-duration">Shift Duration</Label>
              <Select value={shiftDuration} onValueChange={setShiftDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.5 hours">8.5 hours</SelectItem>
                  <SelectItem value="9 hours">9 hours</SelectItem>
                  <SelectItem value="9.5 hours">9.5 hours</SelectItem>
                  <SelectItem value="10 hours">10 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={handleLoadSample} className="gap-2">
                <Upload className="h-4 w-4" />
                Load Sample
              </Button>
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleRunSimulation} className="gap-2 bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4" />
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Volume Matrix */}
      <VolumeMatrixGrid 
        volumeMatrix={volumeMatrix}
        onVolumeMatrixChange={setVolumeMatrix}
        weeks={weeks}
      />

      {/* Roster Grid */}
      <RosterGrid 
        rosterGrid={rosterGrid}
        onRosterGridChange={setRosterGrid}
      />

      {/* Live Staffing Chart */}
      <StaffingChart 
        volumeMatrix={volumeMatrix}
        rosterGrid={rosterGrid}
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
          shiftDuration,
          volumeMatrix,
          rosterGrid
        }}
      />
    </div>
  );
}