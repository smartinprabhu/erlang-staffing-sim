import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, RotateCcw } from "lucide-react";

interface EnhancedRosterGridProps {
  rosterGrid: string[][];
  onRosterGridChange: (grid: string[][]) => void;
}

export function EnhancedRosterGrid({ 
  rosterGrid, 
  onRosterGridChange
}: EnhancedRosterGridProps) {
  const [shiftCounts, setShiftCounts] = useState<number[]>(Array(48).fill(17));
  const [rosterCounts, setRosterCounts] = useState<number[]>(Array(48).fill(0));
  
  // Initialize sample roster values
  useEffect(() => {
    console.log('Initializing roster grid with default values');
    const initialRosterCounts = Array(48).fill(0);
    const sampleValues = [
      {index: 10, value: 5},   // ~5:30 AM
      {index: 20, value: 8},   // ~10:30 AM
      {index: 30, value: 12},  // ~3:30 PM
      {index: 40, value: 7}    // ~8:30 PM
    ];
    
    // Create a fresh grid
    const newGrid = Array(48).fill(null).map(() => Array(48).fill(''));
    
    // Apply all sample values in sequence
    sampleValues.forEach(({index, value}) => {
      initialRosterCounts[index] = value;
      
      // Fill the grid cells for this roster value
      const shiftCount = 17; // Default shift count
      for (let rowOffset = 0; rowOffset < shiftCount; rowOffset++) {
        const targetRow = (index + rowOffset) % 48;
        newGrid[targetRow][index] = value.toString();
      }
    });
    
    // Update all states at once
    onRosterGridChange(newGrid);
    setRosterCounts(initialRosterCounts);
    
    console.log('Roster grid initialized with values at:', 
      sampleValues.map(v => `${v.index}=${v.value}`).join(', '));
  }, [onRosterGridChange]);
  
  // Generate time intervals exactly as Excel SMORT (48 intervals starting from 12:30 AM to 12:00 AM)
  const intervals = Array.from({ length: 48 }, (_, i) => {
    // Excel starts at 12:30 AM (0:30), so we add 30 minutes to the base calculation
    const totalMinutes = (i * 30) + 30; // Start from 30 minutes (12:30 AM)
    const hour = Math.floor(totalMinutes / 60) % 24; // Wrap around at 24 hours
    const minute = totalMinutes % 60;
    
    return {
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      display: `${(hour % 12 || 12).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
      excelFormat: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` // 24-hour format like Excel
    };
  });

  // Initialize roster grid: 48 intervals (rows) x 48 intervals (columns)
  if (rosterGrid.length === 0 || rosterGrid.length !== 48 || rosterGrid[0]?.length !== 48) {
    const defaultRoster = Array(48).fill(null).map(() => Array(48).fill(''));
    onRosterGridChange(defaultRoster);
  }

  // Table cells are now read-only - this function remains for internal use
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
    // Keep shift count always at 17 as per Excel SMORT
    const newShiftCounts = [...shiftCounts];
    newShiftCounts[colIndex] = 17; // Always keep at 17
    setShiftCounts(newShiftCounts);
    
    // If there's a roster value for this column, re-apply it with the new shift count
    const rosterValue = rosterCounts[colIndex];
    if (rosterValue > 0) {
      updateRosterCount(colIndex, rosterValue);
    }
  };

  const updateRosterCount = (colIndex: number, value: number) => {
    const newRosterCounts = [...rosterCounts];
    newRosterCounts[colIndex] = value;
    setRosterCounts(newRosterCounts);
    
    // Excel SMORT Logic: Fill only intersection cells based on Shift count
    if (value > 0) {
      const newGrid = [...rosterGrid];
      
      // Initialize grid if needed
      for (let i = 0; i < 48; i++) {
        if (!newGrid[i]) newGrid[i] = Array(48).fill('');
      }
      
      // Get the shift count for this column (how many rows to fill)
      const shiftCount = shiftCounts[colIndex] || 0;
      
      // Fill intersection cells with wrap-around logic when near end of day
      // Start from colIndex and fill downward for shiftCount intervals
      // If we reach the end (48), continue filling from the beginning
      for (let rowOffset = 0; rowOffset < shiftCount; rowOffset++) {
        const targetRow = (colIndex + rowOffset) % 48;
        newGrid[targetRow][colIndex] = value.toString();
      }
      
      onRosterGridChange(newGrid);
    } else {
      // If value is 0, clear the column
      const newGrid = [...rosterGrid];
      for (let i = 0; i < 48; i++) {
        if (!newGrid[i]) newGrid[i] = Array(48).fill('');
        newGrid[i][colIndex] = '';
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
          <p> Roster Grid: 48 intervals (12:30 AM to 12:00 AM) on both X and Y axes</p>
          <p className="mt-1">Total Rostered Agents: {totalRoster} | Includes Shift and Roster control rows</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded-lg">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 bg-card z-10">
              {/* Header with time intervals - X axis (12:30 AM to 12:00 AM) */}
              <tr>
                <th className="sticky left-[-1px] border border-border p-1 text-left min-w-16 bg-[#475569] text-white font-medium text-xs z-20">
                  TIME
                </th>
                {intervals.map((interval, i) => (
                  <th key={i} className="border border-border p-1 text-center min-w-12 bg-card">
                    <div className="font-medium text-xs">{interval.excelFormat}</div>
                  </th>
                ))}
                <th className="sticky right-0 border border-border p-1 text-center min-w-12 bg-[#475569] text-white font-medium text-xs z-20">
                  Total
                </th>
              </tr>
              
              {/* Shift row - exactly as Excel */}
              <tr className="bg-[#475569]/20">
                <td className="sticky left-0 border border-border p-1 text-center font-medium text-xs bg-[#475569] z-20">
                  Shift
                </td>
                {intervals.map((_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center">
                    <input
                      type="number"
                      className="w-full bg-[#475569]/10 border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6"
                      value={shiftCounts[i]}
                      onChange={(e) => updateShiftCount(i, Number(e.target.value))}
                      placeholder="17"
                      min="0"
                      style={{ width: '100%', minWidth: '40px' }}
                    />
                  </td>
                ))}
              </tr>
              
              {/* Roster row - exactly as Excel */}
              <tr className="bg-[#475569]/70">
                <td className="sticky left-0 border border-border p-1 text-center font-medium text-xs bg-[#475569] z-20">
                  Roster
                </td>
                {intervals.map((_, i) => (
                  <td key={i} className="border border-border p-0.5 text-center">
                    <input
                      type="number"
                      className={`w-full bg-[#475569] border-none text-center text-xs focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-0.5 py-0.5 min-h-6 ${
                        rosterCounts[i] > 0 ? 'bg-[#475569]/30 text-white font-medium' : ''
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
                  <tr key={rowIndex} className="hover:bg-muted">
                    {/* Y-axis intervals (same as X-axis) - exactly as Excel */}
                    <td className="sticky left-0 border border-border p-1 font-medium text-xs bg-[#475569]/40 text-center z-90">
                      <div className="flex flex-col">
                        <span>{interval.excelFormat}</span>
                      </div>
                    </td>
                    {intervals.map((_, colIndex) => {
                      const value = rosterGrid[rowIndex]?.[colIndex] || '';
                      
                      // Check if this cell is filled by roster logic (intersection of X-Y axes)
                      const isRosterFilled = rosterCounts[colIndex] > 0 && 
                                           rowIndex >= colIndex && 
                                           rowIndex < colIndex + (shiftCounts[colIndex] || 0);
                      
                      return (
                        <td key={colIndex} className="border border-border p-0.5 text-center">
                          <div 
                            className={`w-full text-center text-xs px-0.5 py-0.5 min-h-6 ${
                              value && value !== '0' ? 
                                (isRosterFilled ? 'text-green-600 font-medium' : 'text-blue-600 font-medium') : ''
                            }`}
                            style={{ width: '100%', minWidth: '40px' }}
                          >
                            {value || '0'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="sticky right-0 border border-border p-1 text-center font-medium text-xs bg-mute z-10">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">  Logic:</h4>
              <p><strong>Shift Row:</strong> Number of consecutive intervals to fill</p>
              <p><strong>Roster Row:</strong> Agent count to fill at X-Y intersection</p>
              <p><strong>Grid Cells:</strong> Individual agent assignments</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Intersection Logic:</h4>
              <p>• Roster value fills only where X=Y axes match</p>
              <p>• Fills downward for Shift count intervals</p>
              <p>• Example: 5:00 roster fills 5:00→6:00 vertically</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Visual Indicators:</h4>
              <p>• Green = Roster-filled cells</p>
              <p>• Blue = Manually entered cells</p>
              <p>• Empty = No agents assigned</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
