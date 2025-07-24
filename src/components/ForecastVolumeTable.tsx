import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, RotateCcw } from "lucide-react";

interface ForecastVolumeTableProps {
  volumeMatrix: number[][];
  onVolumeMatrixChange: (matrix: number[][]) => void;
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
}

export function ForecastVolumeTable({ 
  volumeMatrix, 
  onVolumeMatrixChange, 
  weeks, 
  fromDate, 
  toDate 
}: ForecastVolumeTableProps) {
  // Generate time intervals exactly as Excel SMORT (48 intervals starting from 12:30 AM to 12:00 AM)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    // Excel starts at 12:30 AM (0:30), so we add 30 minutes to the base calculation
    const totalMinutes = (i * 30); // Start from 30 minutes (12:30 AM)
    const hour = Math.floor(totalMinutes / 60) % 24; // Wrap around at 24 hours
    const minute = totalMinutes % 60;
    
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
      excelFormat: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` // 24-hour format like Excel
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

  // Initialize with sample data if empty
  if (volumeMatrix.length === 0) {
    const sampleData = Array(totalDays).fill(0).map(() => 
      Array(48).fill(0).map((_, i) => {
        const hour = Math.floor(i / 2);
        // Peak hours 9AM-5PM get higher volume
        if (hour >= 9 && hour <= 17) {
          return Math.random() < 0.8 ? Math.floor(Math.random() * 3) + 2 : 0; // 2-5 calls or 0
        } else if (hour >= 7 && hour <= 20) {
          return Math.random() < 0.4 ? Math.floor(Math.random() * 2) + 1 : 0; // 1-3 calls or 0
        }
        return Math.random() < 0.1 ? 1 : 0; // mostly 0, rare 1 call
      })
    );
    onVolumeMatrixChange(sampleData);
  }

  const updateVolumeValue = (dayIndex: number, intervalIndex: number, value: string) => {
    const newMatrix = [...volumeMatrix];
    if (!newMatrix[dayIndex]) {
      newMatrix[dayIndex] = Array(48).fill(0);
    }
    
    // Excel SMORT validation: Only allow positive integers
    const numericValue = parseInt(value) || 0;
    const validatedValue = Math.max(0, numericValue); // Ensure non-negative
    
    newMatrix[dayIndex][intervalIndex] = validatedValue;
    onVolumeMatrixChange(newMatrix);
  };

  const loadSampleData = () => {
    const sampleData = Array(totalDays).fill(0).map(() => 
      Array(48).fill(0).map((_, i) => {
        const hour = Math.floor(i / 2);
        if (hour >= 9 && hour <= 17) {
          return Math.floor(Math.random() * 6) + 8; // 8-14 calls
        } else if (hour >= 6 && hour <= 22) {
          return Math.floor(Math.random() * 4) + 3; // 3-7 calls
        }
        return Math.floor(Math.random() * 2) + 1; // 1-3 calls
      })
    );
    onVolumeMatrixChange(sampleData);
  };

  const clearData = () => {
    onVolumeMatrixChange(Array(totalDays).fill(0).map(() => Array(48).fill(0)));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-md font-semibold text-foreground">
            <BarChart3 className="h-5 w-5" />
            Volume
          </CardTitle>
          { /* <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSampleData} className="text-xs">
              <Upload className="h-3 w-3 mr-2" />
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={clearData} className="text-xs">
              <RotateCcw className="h-3 w-3 mr-2" />
              Clear
            </Button>
          </div> */ }
        </div>
        <p className="text-xs text-muted-foreground">
          Enter expected call volumes for each 30-minute interval.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-80 border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="sticky left-0 border-r border-border p-2 text-left min-w-28 bg-muted font-medium z-20">
                  TIME
                </th>
                {days.map((day, i) => (
                  <th key={i} className="border border-border p-2 text-center min-w-16 bg-muted">
                    <div className="font-medium">{day.dayName}</div>
                    <div className="text-xs text-muted-foreground/80">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {intervals.map((interval, intervalIndex) => (
                <tr key={intervalIndex} className="hover:bg-muted/50">
                  <td className="sticky left-0 border-r border-border p-2 font-medium bg-muted/40 z-10">
                    <div className="flex flex-col">
                      <span className="font-medium">{interval.excelFormat}</span>
                      <span className="text-xs text-muted-foreground/80">{interval.display}</span>
                    </div>
                  </td>
                  {days.map((_, dayIndex) => (
                    <td key={dayIndex} className="border border-border p-0.5 text-center">
                      <input
                        type="number"
                        className="w-full bg-transparent border-none text-center text-sm focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 py-1"
                        value={volumeMatrix[dayIndex]?.[intervalIndex] || 0}
                        onChange={(e) => updateVolumeValue(dayIndex, intervalIndex, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
