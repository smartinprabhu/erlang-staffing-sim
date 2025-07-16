import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface VolumeMatrixGridProps {
  volumeMatrix: number[][];
  onVolumeMatrixChange: (matrix: number[][]) => void;
  weeks: 4 | 8 | 12;
}

export function VolumeMatrixGrid({ volumeMatrix, onVolumeMatrixChange, weeks }: VolumeMatrixGridProps) {
  const days = weeks * 7;
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  // Initialize with default values if empty
  if (volumeMatrix.length === 0) {
    const defaultMatrix = Array(days).fill(0).map(() => 
      Array(48).fill(0).map(() => Math.floor(Math.random() * 100) + 20)
    );
    onVolumeMatrixChange(defaultMatrix);
  }

  const clearData = () => {
    onVolumeMatrixChange([]);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Interval-wise Volume</CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Date Range: 2025-06-29 to 2025-07-26
            </span>
            <span className="text-sm text-muted-foreground">
              Total Days: {days} ({weeks} weeks)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={clearData}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          48 intervals × {days} days contact volume matrix
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96">
          <div className="min-w-full">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="sticky left-0 bg-card border border-border p-2 text-left min-w-20">
                    TIME<br />INTERVAL
                  </th>
                  {Array.from({ length: Math.min(14, days) }, (_, i) => {
                    const date = new Date('2025-06-29');
                    date.setDate(date.getDate() + i);
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    return (
                      <th key={i} className="border border-border p-2 text-center min-w-16 bg-card">
                        <div className="text-xs font-medium">{dayNames[date.getDay()]}</div>
                        <div className="text-xs text-muted-foreground">
                          {date.getDate().toString().padStart(2, '0')}/{(date.getMonth() + 1).toString().padStart(2, '0')}
                        </div>
                      </th>
                    );
                  })}
                  <th className="border border-border p-2 text-center bg-warning text-warning-foreground">
                    HOURLY<br />SUM &<br />%
                  </th>
                </tr>
              </thead>
              <tbody>
                {intervals.map((interval, i) => (
                  <tr key={i}>
                    <td className="sticky left-0 bg-card border border-border p-2 text-sm font-medium">
                      {interval}
                    </td>
                    {Array.from({ length: Math.min(14, days) }, (_, j) => (
                      <td key={j} className="border border-border p-1 text-center">
                        <input
                          type="number"
                          className="w-full bg-transparent border-none text-center text-sm"
                          value={volumeMatrix[j]?.[i] || 0}
                          onChange={(e) => {
                            const newMatrix = [...volumeMatrix];
                            if (!newMatrix[j]) newMatrix[j] = Array(48).fill(0);
                            newMatrix[j][i] = Number(e.target.value);
                            onVolumeMatrixChange(newMatrix);
                          }}
                        />
                      </td>
                    ))}
                    <td className="border border-border p-2 text-center text-sm bg-warning/20">
                      0<br />
                      <span className="text-xs text-muted-foreground">NaN%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}