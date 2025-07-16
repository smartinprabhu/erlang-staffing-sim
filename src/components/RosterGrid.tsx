import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Download, RotateCcw } from "lucide-react";

interface RosterGridProps {
  rosterGrid: string[][];
  onRosterGridChange: (grid: string[][]) => void;
}

export function RosterGrid({ rosterGrid, onRosterGridChange }: RosterGridProps) {
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const addAgent = () => {
    const newGrid = [...rosterGrid];
    newGrid.push(Array(48).fill(""));
    onRosterGridChange(newGrid);
  };

  const removeAgent = (index: number) => {
    const newGrid = rosterGrid.filter((_, i) => i !== index);
    onRosterGridChange(newGrid);
  };

  const updateCell = (agentIndex: number, intervalIndex: number, value: string) => {
    const newGrid = [...rosterGrid];
    if (!newGrid[agentIndex]) newGrid[agentIndex] = Array(48).fill("");
    newGrid[agentIndex][intervalIndex] = value;
    onRosterGridChange(newGrid);
  };

  const generateSampleRoster = () => {
    const sampleGrid = Array(20).fill(0).map(() => 
      Array(48).fill(0).map((_, i) => {
        // Simulate shift patterns
        const hour = Math.floor(i / 2);
        if (hour >= 8 && hour <= 17) {
          return Math.random() > 0.3 ? "S" : "";
        }
        return "";
      })
    );
    onRosterGridChange(sampleGrid);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Editable Roster Grid (Shift Planner)
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={generateSampleRoster}>
              Load Sample
            </Button>
            <Button variant="outline" size="sm" onClick={addAgent}>
              Add Agent
            </Button>
            <Button variant="outline" size="sm" onClick={() => onRosterGridChange([])}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          48 columns = half-hour intervals. Add/remove agents per interval directly.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card border border-border p-2 text-left min-w-20">
                    Agent
                  </th>
                  {intervals.slice(0, 24).map((interval, i) => (
                    <th key={i} className="border border-border p-1 text-center min-w-12">
                      <div className="text-xs transform -rotate-45 whitespace-nowrap">
                        {interval}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rosterGrid.map((agent, agentIndex) => (
                  <tr key={agentIndex}>
                    <td className="sticky left-0 bg-card border border-border p-2 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        Agent {agentIndex + 1}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAgent(agentIndex)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </td>
                    {intervals.slice(0, 24).map((_, intervalIndex) => (
                      <td key={intervalIndex} className="border border-border p-1">
                        <input
                          type="text"
                          className="w-full bg-transparent border-none text-center text-sm"
                          value={agent[intervalIndex] || ""}
                          onChange={(e) => updateCell(agentIndex, intervalIndex, e.target.value)}
                          placeholder=""
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {rosterGrid.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No agents added yet. Click "Add Agent" to start building your roster.
          </div>
        )}
      </CardContent>
    </Card>
  );
}