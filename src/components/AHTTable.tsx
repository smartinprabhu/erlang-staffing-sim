import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Upload, RotateCcw } from "lucide-react";

interface AHTTableProps {
  ahtMatrix: number[][];
  onAHTMatrixChange: (matrix: number[][]) => void;
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
}

export function AHTTable({ 
  ahtMatrix, 
  onAHTMatrixChange, 
  weeks, 
  fromDate, 
  toDate 
}: AHTTableProps) {
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

  // Initialize with default AHT values if empty (1560 seconds = 26 minutes)
  if (ahtMatrix.length === 0) {
    const defaultAHT = Array(totalDays).fill(0).map(() => 
      Array(48).fill(1560) // Default 26 minutes (1560 seconds)
    );
    onAHTMatrixChange(defaultAHT);
  }

  const updateAHTValue = (dayIndex: number, intervalIndex: number, value: string) => {
    const newMatrix = [...ahtMatrix];
    if (!newMatrix[dayIndex]) {
      newMatrix[dayIndex] = Array(48).fill(1560);
    }
    newMatrix[dayIndex][intervalIndex] = parseInt(value) || 1560;
    onAHTMatrixChange(newMatrix);
  };

  const loadSampleData = () => {
    const sampleData = Array(totalDays).fill(0).map(() => 
      Array(48).fill(0).map(() => {
        // AHT varies slightly throughout the day (24-28 minutes)
        return Math.floor(Math.random() * 240) + 1440; // 1440-1680 seconds (24-28 min)
      })
    );
    onAHTMatrixChange(sampleData);
  };

  const clearData = () => {
    onAHTMatrixChange(Array(totalDays).fill(0).map(() => Array(48).fill(1560)));
  };

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            AHT (Average Handle Time) Table
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Upload className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={clearData}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Enter Average Handle Time values in seconds per interval. AHT is independent of volume.</p>
          <p className="mt-1">Date Range: {fromDate} to {toDate} | {totalDays} days ({weeks} weeks)</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                <th className="border border-border p-2 text-left min-w-28 bg-card font-medium">
                  TIME INTERVAL
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
                <tr key={intervalIndex} className="hover:bg-muted/50">
                  <td className="border border-border p-2 font-medium bg-muted/20">
                    {interval.display}
                  </td>
                  {days.map((_, dayIndex) => {
                    const ahtValue = ahtMatrix[dayIndex]?.[intervalIndex] || 1560;
                    return (
                      <td key={dayIndex} className="border border-border p-1 text-center">
                        <div className="space-y-1">
                          <input
                            type="number"
                            className="w-full bg-transparent border-none text-center text-sm focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1 py-1"
                            value={ahtValue}
                            onChange={(e) => updateAHTValue(dayIndex, intervalIndex, e.target.value)}
                            placeholder="1560"
                            min="0"
                          />
                          <div className="text-xs text-muted-foreground">
                            {formatSeconds(ahtValue)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 bg-muted/20 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Formula:</h4>
          <p className="text-muted-foreground">
            <strong>AHT = (Talk Time + Hold Time + After-Call Work) ÷ Number of Calls</strong>
          </p>
          <p className="text-muted-foreground mt-1">
            AHT is measured in seconds and represents the total time agents spend per call including talk, hold, and wrap-up time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}