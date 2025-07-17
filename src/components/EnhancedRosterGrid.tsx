import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  
  // Generate time intervals (48 intervals per day - 30 min each)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
    };
  });

  // Generate days based on date range
  const totalDays = weeks * 7;
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: dayNames[date.getDay()],
      date: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
      fullDate: date.toISOString().split('T')[0]
    };
  });

  // Initialize with default 17-shift pattern if empty
  if (rosterGrid.length === 0 || rosterGrid[0]?.length !== 48) {
    const defaultRoster = Array(48).fill('').map((_, i) => {
      const hour = Math.floor(i / 2);
      // 17-hour shift: 6:00 AM to 11:00 PM (6-22 = 17 hours)
      if (hour >= 6 && hour <= 22) {
        if (hour >= 9 && hour <= 17) {
          return String(Math.floor(Math.random() * 8) + 25); // Peak hours: 25-32 agents
        } else {
          return String(Math.floor(Math.random() * 5) + 15); // Off-peak: 15-19 agents
        }
      }
      return ''; // Off hours - empty
    });
    onRosterGridChange([defaultRoster]);
  }

  const updateRosterValue = (intervalIndex: number, value: string) => {
    const newGrid = [...rosterGrid];
    if (newGrid.length === 0) {
      newGrid.push(Array(48).fill(''));
    }
    newGrid[0][intervalIndex] = value;
    onRosterGridChange(newGrid);
  };

  const clearRoster = () => {
    onRosterGridChange([Array(48).fill('')]);
  };

  // Calculate total rostered agents (sum of all values)
  const calculateTotalRoster = () => {
    if (rosterGrid.length === 0) return 0;
    return rosterGrid[0]?.reduce((total, value) => {
      const num = parseInt(value) || 0;
      return total + num;
    }, 0) || 0;
  };

  // Calculate active shifts (non-empty, non-zero values) - should be 17
  const calculateActiveShifts = () => {
    if (rosterGrid.length === 0) return 0;
    return rosterGrid[0]?.reduce((count, value) => {
      return count + (value && value !== '0' && value !== '' ? 1 : 0);
    }, 0) || 0;
  };

  const totalRoster = calculateTotalRoster();
  const activeShifts = calculateActiveShifts();

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
          <p>17-shift schedule grid (6:00 AM - 11:00 PM). Enter number of agents per 30-minute slot.</p>
          <p className="mt-1">Date Range: {fromDate} to {toDate} | Active Shifts: {activeShifts}/17 | Total Agents: {totalRoster}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="border border-border p-2 text-left min-w-28 bg-card font-medium">
                  Scheduling
                </th>
                {days.map((day, i) => (
                  <th key={i} className="border border-border p-2 text-center min-w-16 bg-card">
                    <div className="font-medium">{day.dayName}</div>
                    <div className="text-xs text-muted-foreground">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Shift Count Row - Fixed at 17 */}
              <tr className="bg-secondary/20">
                <td className="border border-border p-2 font-medium">
                  Shift
                </td>
                {days.map((_, dayIndex) => (
                  <td key={dayIndex} className="border border-border p-2 text-center font-medium">
                    17
                  </td>
                ))}
              </tr>
              
              {/* Roster Total Row */}
              <tr className="bg-primary/10">
                <td className="border border-border p-2 font-medium">
                  Roster
                </td>
                {days.map((_, dayIndex) => (
                  <td key={dayIndex} className="border border-border p-2 text-center font-medium text-primary">
                    {totalRoster}
                  </td>
                ))}
              </tr>

              {/* Time Intervals */}
              {intervals.map((interval, intervalIndex) => {
                const hour = Math.floor(intervalIndex / 2);
                const isActiveShift = hour >= 6 && hour <= 22; // 17-hour shift window
                const rosterValue = rosterGrid[0]?.[intervalIndex] || '';
                
                return (
                  <tr key={intervalIndex} className={`hover:bg-muted/50 ${isActiveShift ? 'bg-background' : 'bg-muted/30'}`}>
                    <td className="border border-border p-2 font-medium">
                      <div className="flex items-center gap-2">
                        {interval.display}
                        {isActiveShift && (
                          <span className="w-2 h-2 bg-primary rounded-full" title="Active shift hour" />
                        )}
                      </div>
                    </td>
                    {days.map((_, dayIndex) => (
                      <td key={dayIndex} className="border border-border p-1 text-center">
                        <input
                          type="number"
                          className={`w-full bg-transparent border-none text-center text-sm focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 py-1 ${
                            isActiveShift ? 'font-medium' : 'text-muted-foreground'
                          }`}
                          value={rosterValue}
                          onChange={(e) => updateRosterValue(intervalIndex, e.target.value)}
                          placeholder="0"
                          min="0"
                          disabled={!isActiveShift}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-muted/20 rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Shift Summary:</h4>
              <p><strong>Shift Count</strong> = 17 (fixed, 6:00 AM - 11:00 PM)</p>
              <p><strong>Roster Total</strong> = Σ(all roster grid cells) = {totalRoster}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Instructions:</h4>
              <p>• Enter agent count per 30-minute slot</p>
              <p>• Active shifts: 6:00 AM to 11:00 PM (17 hours)</p>
              <p>• Changes update all metrics automatically</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}