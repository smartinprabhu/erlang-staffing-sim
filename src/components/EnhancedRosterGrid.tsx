import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, RotateCcw } from "lucide-react";

interface EnhancedRosterGridProps {
  rosterGrid: string[][];
  onRosterGridChange: (grid: string[][]) => void;
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
}

export function EnhancedRosterGrid({ 
  rosterGrid, 
  onRosterGridChange, 
  weeks, 
  fromDate, 
  toDate 
}: EnhancedRosterGridProps) {
  const [rosterCount, setRosterCount] = useState<number>(0);
  
  // Generate time intervals (48 intervals per day - 30 min each, starting from 12:30 AM)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
    };
  });

  // 17 shifts as columns
  const shifts = Array.from({ length: 17 }, (_, i) => `Shift ${i + 1}`);

  // Initialize roster grid: 48 intervals (rows) x 17 shifts (columns)
  if (rosterGrid.length === 0 || rosterGrid.length !== 48 || rosterGrid[0]?.length !== 17) {
    const defaultRoster = Array(48).fill(null).map(() => Array(17).fill(''));
    onRosterGridChange(defaultRoster);
  }

  const updateRosterValue = (intervalIndex: number, shiftIndex: number, value: string) => {
    const newGrid = [...rosterGrid];
    if (newGrid.length !== 48) {
      const defaultGrid = Array(48).fill(null).map(() => Array(17).fill(''));
      newGrid.splice(0, newGrid.length, ...defaultGrid);
    }
    if (!newGrid[intervalIndex]) {
      newGrid[intervalIndex] = Array(17).fill('');
    }
    newGrid[intervalIndex][shiftIndex] = value;
    onRosterGridChange(newGrid);
  };

  const clearRoster = () => {
    onRosterGridChange(Array(48).fill(null).map(() => Array(17).fill('')));
  };

  const handleRosterCountChange = (count: number) => {
    setRosterCount(count);
    if (count > 0) {
      const newGrid = Array(48).fill(null).map(() => Array(17).fill(count.toString()));
      onRosterGridChange(newGrid);
    }
  };

  // Calculate total rostered agents (sum of all values)
  const calculateTotalRoster = () => {
    if (rosterGrid.length === 0) return 0;
    return rosterGrid.reduce((total, row) => {
      return total + row.reduce((rowTotal, value) => {
        const num = parseInt(value) || 0;
        return rowTotal + num;
      }, 0);
    }, 0);
  };

  // Calculate agents per interval (row sum)
  const calculateIntervalTotal = (intervalIndex: number) => {
    if (rosterGrid.length === 0 || !rosterGrid[intervalIndex]) return 0;
    return rosterGrid[intervalIndex].reduce((total, value) => {
      const num = parseInt(value) || 0;
      return total + num;
    }, 0);
  };

  // Calculate agents per shift (column sum)
  const calculateShiftTotal = (shiftIndex: number) => {
    if (rosterGrid.length === 0) return 0;
    return rosterGrid.reduce((total, row) => {
      const num = parseInt(row[shiftIndex]) || 0;
      return total + num;
    }, 0);
  };

  const totalRoster = calculateTotalRoster();

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daily Roster Schedule Grid
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearRoster}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>48 time intervals (Y-axis) × 17 shifts (X-axis). Single day roster scheduling from 12:30 AM to 12:00 AM.</p>
          <p className="mt-1">Total Rostered Agents: {totalRoster}</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Roster Count Input */}
        <div className="mb-4 flex items-center gap-4">
          <Label htmlFor="roster-count">Roster Count:</Label>
          <Input
            id="roster-count"
            type="number"
            value={rosterCount}
            onChange={(e) => handleRosterCountChange(Number(e.target.value))}
            placeholder="Enter number to fill all shifts"
            className="w-48"
            min="0"
          />
          <span className="text-sm text-muted-foreground">
            Fill all cells with this number
          </span>
        </div>

        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="border border-border p-2 text-left min-w-24 bg-card font-medium">
                  TIME INTERVALS
                </th>
                {shifts.map((shift, i) => (
                  <th key={i} className="border border-border p-1 text-center min-w-16 bg-card">
                    <div className="font-medium text-xs">{shift}</div>
                    <div className="text-xs text-muted-foreground">
                      {calculateShiftTotal(i)}
                    </div>
                  </th>
                ))}
                <th className="border border-border p-2 text-center min-w-16 bg-secondary/20 font-medium">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((interval, intervalIndex) => {
                const intervalTotal = calculateIntervalTotal(intervalIndex);
                
                return (
                  <tr key={intervalIndex} className="hover:bg-muted/20">
                    <td className="border border-border p-2 font-medium text-xs bg-muted/20">
                      <div className="flex flex-col">
                        <span>{interval.display}</span>
                        <span className="text-xs text-muted-foreground">{interval.time}</span>
                      </div>
                    </td>
                    {shifts.map((_, shiftIndex) => {
                      const value = rosterGrid[intervalIndex]?.[shiftIndex] || '';
                      
                      return (
                        <td key={shiftIndex} className="border border-border p-0.5 text-center">
                          <input
                            type="number"
                            className={`w-full bg-transparent border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6 ${
                              value && value !== '0' ? 'bg-green-50 text-green-800 font-medium' : ''
                            }`}
                            value={value}
                            onChange={(e) => updateRosterValue(intervalIndex, shiftIndex, e.target.value)}
                            placeholder="0"
                            min="0"
                            style={{ width: '100%', minWidth: '40px' }}
                          />
                        </td>
                      );
                    })}
                    <td className="border border-border p-1 text-center font-medium bg-secondary/10">
                      {intervalTotal}
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr className="bg-primary/10 font-medium">
                <td className="border border-border p-2 bg-primary/20">
                  TOTAL
                </td>
                {shifts.map((_, shiftIndex) => (
                  <td key={shiftIndex} className="border border-border p-1 text-center bg-primary/5">
                    {calculateShiftTotal(shiftIndex)}
                  </td>
                ))}
                <td className="border border-border p-1 text-center bg-primary/20 font-bold">
                  {totalRoster}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-muted/20 rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Formulas:</h4>
              <p><strong>Total Agents</strong> = Σ(all cells)</p>
              <p><strong>Interval Total</strong> = Σ(shifts per row)</p>
              <p><strong>Shift Total</strong> = Σ(intervals per column)</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dependencies:</h4>
              <p>• Affects all calculated metrics</p>
              <p>• Updates charts dynamically</p>
              <p>• Drives staffing requirements</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Usage:</h4>
              <p>• Use Roster Count for quick fill</p>
              <p>• Edit individual cells for fine-tuning</p>
              <p>• Green = scheduled agents</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}