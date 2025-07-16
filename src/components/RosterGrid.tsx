import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, RotateCcw } from "lucide-react";

interface RosterGridProps {
  rosterGrid: string[][];
  onRosterGridChange: (grid: string[][]) => void;
}

export function RosterGrid({ rosterGrid, onRosterGridChange }: RosterGridProps) {
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

  // Generate days (showing 14 days for this example)
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date('2025-06-29');
    date.setDate(date.getDate() + i);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: dayNames[date.getDay()],
      date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
      fullDate: date.toISOString().split('T')[0]
    };
  });

  // Initialize roster values if empty
  const rosterValues = rosterGrid.length > 0 ? rosterGrid[0] : Array(48).fill('');
  
  // Initialize with default values if empty
  const initializeDefaultValues = () => {
    if (rosterGrid.length === 0) {
      // Default roster pattern: higher staffing during business hours
      const defaultRoster = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        if (hour >= 8 && hour <= 17) {
          return '5'; // Business hours
        } else if (hour >= 6 && hour <= 20) {
          return '2'; // Extended hours
        }
        return '0'; // Off hours
      });
      onRosterGridChange([defaultRoster]);
    }
  };

  // Initialize on component mount
  if (rosterGrid.length === 0) {
    initializeDefaultValues();
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

  // Calculate shift count (non-empty values)
  const calculateShiftCount = (dayIndex: number) => {
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
                          <span className="text-sm">17</span>
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
                              {dayIndex === 0 ? (
                                <input
                                  type="text"
                                  className="w-full bg-transparent border-none text-center text-sm"
                                  value={cellValue}
                                  onChange={(e) => updateRosterValue(intervalIndex, e.target.value)}
                                  placeholder="0"
                                />
                              ) : (
                                <span className="text-sm">{cellValue}</span>
                              )}
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
            <VolumeTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Volume Table Component
function VolumeTable() {
  const [volumeData, setVolumeData] = useState<number[][]>([]);
  
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date('2025-06-29');
    date.setDate(date.getDate() + i);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: dayNames[date.getDay()],
      date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
    };
  });

  const updateVolumeValue = (dayIndex: number, intervalIndex: number, value: string) => {
    const newData = [...volumeData];
    if (!newData[dayIndex]) {
      newData[dayIndex] = Array(48).fill(0);
    }
    newData[dayIndex][intervalIndex] = parseInt(value) || 0;
    setVolumeData(newData);
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
                      value={volumeData[dayIndex]?.[intervalIndex] || 0}
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