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
  const [shiftCounts, setShiftCounts] = useState<number[]>(Array(48).fill(17));
  const [rosterCounts, setRosterCounts] = useState<number[]>(Array(48).fill(0));
  
  // Generate time intervals (48 intervals per day - 30 min each, starting from 12:30 AM)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
    };
  });

  // Initialize roster grid: 48 intervals (rows) x 48 intervals (columns)
  if (rosterGrid.length === 0 || rosterGrid.length !== 48 || rosterGrid[0]?.length !== 48) {
    const defaultRoster = Array(48).fill(null).map(() => Array(48).fill(''));
    onRosterGridChange(defaultRoster);
  }

  const updateRosterValue = (rowIndex: number, colIndex: number, value: string) => {
    const newGrid = [...rosterGrid];
    if (newGrid.length !== 48) {
      const defaultGrid = Array(48).fill(null).map(() => Array(48).fill(''));
      newGrid.splice(0, newGrid.length, ...defaultGrid);
    }
    if (!newGrid[rowIndex]) {
      newGrid[rowIndex] = Array(48).fill('');
    }
    newGrid[rowIndex][colIndex] = value;
    onRosterGridChange(newGrid);
  };

  const updateShiftCount = (colIndex: number, value: number) => {
    const newShiftCounts = [...shiftCounts];
    newShiftCounts[colIndex] = value;
    setShiftCounts(newShiftCounts);
  };

  const updateRosterCount = (colIndex: number, value: number) => {
    const newRosterCounts = [...rosterCounts];
    newRosterCounts[colIndex] = value;
    setRosterCounts(newRosterCounts);
    
    // Fill all cells in this column with the roster value
    if (value > 0) {
      const newGrid = [...rosterGrid];
      for (let i = 0; i < 48; i++) {
        if (!newGrid[i]) newGrid[i] = Array(48).fill('');
        newGrid[i][colIndex] = value.toString();
      }
      onRosterGridChange(newGrid);
    }
  };

  const clearRoster = () => {
    onRosterGridChange(Array(48).fill(null).map(() => Array(48).fill('')));
    setRosterCounts(Array(48).fill(0));
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

  // Calculate agents per interval row (sum across columns)
  const calculateRowTotal = (rowIndex: number) => {
    if (rosterGrid.length === 0 || !rosterGrid[rowIndex]) return 0;
    return rosterGrid[rowIndex].reduce((total, value) => {
      const num = parseInt(value) || 0;
      return total + num;
    }, 0);
  };

  // Calculate agents per interval column (sum down rows)
  const calculateColumnTotal = (colIndex: number) => {
    if (rosterGrid.length === 0) return 0;
    return rosterGrid.reduce((total, row) => {
      const num = parseInt(row[colIndex]) || 0;
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
            Roster Schedule Grid
          </CardTitle>
          <Button variant="outline" size="sm" onClick={clearRoster}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>48 time intervals (both axes). Enter shift counts and roster values per interval.</p>
          <p className="mt-1">Total Rostered Agents: {totalRoster}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-card z-10">
              {/* Header with time intervals */}
              <tr>
                <th className="border border-border p-1 text-left min-w-16 bg-card font-medium text-xs">
                  MT
                </th>
                {intervals.map((interval, i) => (
                  <th key={i} className="border border-border p-1 text-center min-w-12 bg-card">
                    <div className="font-medium text-xs">{interval.display}</div>
                  </th>
                ))}
              </tr>
              
              {/* Shift row */}
              <tr className="bg-yellow-100">
                <td className="border border-border p-1 text-center font-medium text-xs bg-yellow-200">
                  Shift
                </td>
                {intervals.map((_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center">
                    <input
                      type="number"
                      className="w-full bg-transparent border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6"
                      value={shiftCounts[i]}
                      onChange={(e) => updateShiftCount(i, Number(e.target.value))}
                      placeholder="17"
                      min="0"
                      style={{ width: '100%', minWidth: '40px' }}
                    />
                  </td>
                ))}
              </tr>
              
              {/* Roster row */}
              <tr className="bg-green-100">
                <td className="border border-border p-1 text-center font-medium text-xs bg-green-200">
                  Roster
                </td>
                {intervals.map((_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center">
                    <input
                      type="number"
                      className={`w-full bg-transparent border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6 ${
                        rosterCounts[i] > 0 ? 'bg-green-50 text-green-800 font-medium' : ''
                      }`}
                      value={rosterCounts[i] || ''}
                      onChange={(e) => updateRosterCount(i, Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      style={{ width: '100%', minWidth: '40px' }}
                    />
                  </td>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {intervals.map((interval, rowIndex) => {
                const rowTotal = calculateRowTotal(rowIndex);
                
                return (
                  <tr key={rowIndex} className="hover:bg-muted/20">
                    <td className="border border-border p-1 font-medium text-xs bg-muted/20 text-center">
                      <div className="flex flex-col">
                        <span>{interval.time}</span>
                      </div>
                    </td>
                    {intervals.map((_, colIndex) => {
                      const value = rosterGrid[rowIndex]?.[colIndex] || '';
                      
                      return (
                        <td key={colIndex} className="border border-border p-0.5 text-center">
                          <input
                            type="number"
                            className={`w-full bg-transparent border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6 ${
                              value && value !== '0' ? 'bg-green-50 text-green-800 font-medium' : ''
                            }`}
                            value={value}
                            onChange={(e) => updateRosterValue(rowIndex, colIndex, e.target.value)}
                            placeholder="0"
                            min="0"
                            style={{ width: '100%', minWidth: '40px' }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-muted/20 rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Grid Structure:</h4>
              <p><strong>Shift Row:</strong> Number of shifts per interval</p>
              <p><strong>Roster Row:</strong> Fill entire column with value</p>
              <p><strong>Grid Cells:</strong> Individual agent assignments</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Dependencies:</h4>
              <p>• Affects all calculated metrics</p>
              <p>• Updates charts dynamically</p>
              <p>• Drives Erlang C calculations</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Usage:</h4>
              <p>• Roster row fills entire column</p>
              <p>• Edit cells for fine-tuning</p>
              <p>• Green = assigned agents</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}