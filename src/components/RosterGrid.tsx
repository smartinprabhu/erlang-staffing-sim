import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, RotateCcw } from "lucide-react";

interface RosterGridProps {
  rosterGrid: string[][];
  onRosterGridChange: (grid: string[][]) => void;
  volumeMatrix: number[][];
  onVolumeMatrixChange: (matrix: number[][]) => void;
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
}

export function RosterGrid({ rosterGrid, onRosterGridChange, volumeMatrix, onVolumeMatrixChange, weeks, fromDate, toDate }: RosterGridProps) {
  const [activeTab, setActiveTab] = useState("roster");
  
  // Generate all 48 intervals (00:00 to 23:30)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      period: hour < 12 ? 'AM' : 'PM',
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
      date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
      fullDate: date.toISOString().split('T')[0]
    };
  });

  // Initialize with default values if empty
  if (rosterGrid.length === 0) {
    // Default roster pattern: 17 hours shift (6:00 AM to 11:00 PM)
    const defaultRoster = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      if (hour >= 6 && hour <= 22) { // 17 hours: 6:00 AM to 11:00 PM
        if (hour >= 8 && hour <= 18) {
          return String(Math.floor(Math.random() * 8) + 12); // Peak hours: 12-20 agents
        } else {
          return String(Math.floor(Math.random() * 5) + 3); // Off-peak: 3-8 agents
        }
      }
      return '0'; // Off hours
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

  // Calculate shift count (non-empty values) - should be 17 hours
  const calculateShiftCount = () => {
    if (rosterGrid.length === 0) return 0;
    return intervals.reduce((count, _, intervalIndex) => {
      const value = rosterGrid[0][intervalIndex];
      return count + (value && value !== '0' && value !== '' ? 1 : 0);
    }, 0);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Scheduling Grid
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearRoster}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="roster">Roster Grid</TabsTrigger>
            <TabsTrigger value="volume">Volume Table</TabsTrigger>
          </TabsList>

          <TabsContent value="roster">
            <div className="overflow-auto max-h-96">
              <div className="min-w-full">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr>
                      <th className="border border-border p-2 text-left min-w-24 bg-card">
                        
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
                    {/* Roster Row - Editable */}
                    <tr className="bg-muted/50">
                      <td className="border border-border p-2 font-medium">
                        Roster
                      </td>
                      {days.map((_, dayIndex) => (
                        <td key={dayIndex} className="border border-border p-1 text-center">
                          <span className="text-sm font-medium">
                            {intervals.reduce((total, _, intervalIndex) => {
                              const value = rosterGrid[0]?.[intervalIndex] || '';
                              return total + (value && value !== '0' ? parseInt(value) || 0 : 0);
                            }, 0)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Shift Count Row */}
                     <tr>
                       <td className="border border-border p-2 font-medium">
                         Shift
                       </td>
                       {days.map((_, dayIndex) => (
                         <td key={dayIndex} className="border border-border p-2 text-center">
                           <span className="text-sm">{calculateShiftCount()}</span>
                         </td>
                       ))}
                     </tr>

                    {/* Time Intervals */}
                    {intervals.map((interval, intervalIndex) => (
                      <tr key={intervalIndex}>
                        <td className="border border-border p-2 font-medium">
                          {interval.display}
                        </td>
                        {days.map((_, dayIndex) => {
                          const rosterValue = rosterGrid[0]?.[intervalIndex] || '';
                          const cellValue = rosterValue && rosterValue !== '0' ? rosterValue : '';
                          
                          return (
                            <td key={dayIndex} className="border border-border p-1 text-center">
                              <input
                                type="text"
                                className="w-full bg-transparent border-none text-center text-sm"
                                value={cellValue}
                                onChange={(e) => updateRosterValue(intervalIndex, e.target.value)}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="volume">
            <VolumeTable volumeMatrix={volumeMatrix} onVolumeMatrixChange={onVolumeMatrixChange} days={days} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Volume Table Component
function VolumeTable({ volumeMatrix, onVolumeMatrixChange, days }: { volumeMatrix: number[][], onVolumeMatrixChange: (matrix: number[][]) => void, days: any[] }) {
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Initialize with default values if empty
  if (volumeMatrix.length === 0) {
    const defaultData = Array(days.length).fill(0).map(() => 
      Array(48).fill(0).map(() => Math.floor(Math.random() * 100) + 20)
    );
    onVolumeMatrixChange(defaultData);
  }

  const updateVolumeValue = (dayIndex: number, intervalIndex: number, value: string) => {
    const newData = [...volumeMatrix];
    if (!newData[dayIndex]) {
      newData[dayIndex] = Array(48).fill(0);
    }
    newData[dayIndex][intervalIndex] = parseInt(value) || 0;
    onVolumeMatrixChange(newData);
  };

  return (
    <div className="overflow-auto max-h-96">
      <div className="min-w-full">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              <th className="border border-border p-2 text-left min-w-24 bg-card">
                TIME<br />INTERVAL
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
            {intervals.map((interval, intervalIndex) => (
              <tr key={intervalIndex}>
                <td className="border border-border p-2 font-medium">
                  {interval}
                </td>
                {days.map((_, dayIndex) => (
                  <td key={dayIndex} className="border border-border p-1 text-center">
                    <input
                      type="number"
                      className="w-full bg-transparent border-none text-center text-sm"
                      value={volumeMatrix[dayIndex]?.[intervalIndex] || 0}
                      onChange={(e) => updateVolumeValue(dayIndex, intervalIndex, e.target.value)}
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}