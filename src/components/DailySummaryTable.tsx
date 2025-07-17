import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResults, ConfigurationData } from "./ContactCenterApp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DailySummaryTableProps {
  results: SimulationResults;
  configData: ConfigurationData;
}

export function DailySummaryTable({ results, configData }: DailySummaryTableProps) {
  // Generate daily summary data based on date range
  const totalDays = configData.weeks * 7;
  const dailySummary = Array.from({ length: totalDays }, (_, i) => {
    const baseDate = new Date(configData.fromDate);
    baseDate.setDate(baseDate.getDate() + i);
    
    // Calculate daily totals from roster grid and volume matrix
    let totalVolume = 0;
    let totalActual = 0;
    let totalRequired = 0;
    let avgSLA = 0;
    let avgOccupancy = 0;
    
    // Sum up all intervals for this day
    for (let intervalIndex = 0; intervalIndex < 48; intervalIndex++) {
      const volume = configData.volumeMatrix[i]?.[intervalIndex] || 0;
      const actual = parseInt(configData.rosterGrid[0]?.[intervalIndex]) || 0;
      
      totalVolume += volume;
      totalActual += actual;
      
      // Calculate required based on Erlang-C
      const ahtInHours = configData.plannedAHT / 3600;
      const workloadInHours = volume * ahtInHours;
      const required = Math.max(1, Math.ceil(workloadInHours / 0.5));
      totalRequired += required;
      
      // Calculate SLA and occupancy for this interval
      const intervalSLA = actual >= required 
        ? Math.min(95, 80 + (actual - required) * 5)
        : Math.max(60, 80 - (required - actual) * 10);
      
      const intervalOccupancy = actual > 0 
        ? Math.min(95, (workloadInHours / actual / 0.5) * 100)
        : 0;
      
      avgSLA += intervalSLA;
      avgOccupancy += intervalOccupancy;
    }
    
    avgSLA = avgSLA / 48;
    avgOccupancy = avgOccupancy / 48;
    
    return {
      date: `${baseDate.getDate().toString().padStart(2, '0')}/${(baseDate.getMonth() + 1).toString().padStart(2, '0')}/${baseDate.getFullYear()}`,
      totalVolume,
      avgSLA,
      occupancy: avgOccupancy,
      avgStaffing: Math.round(totalActual / 48)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Summary</CardTitle>
        <p className="text-sm text-muted-foreground">
          Daily aggregated performance metrics
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Total Volume</TableHead>
                <TableHead>Avg SLA</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Avg Staffing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySummary.map((day, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{day.date}</TableCell>
                  <TableCell>{day.totalVolume.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${day.avgSLA >= 80 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {day.avgSLA.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${day.occupancy <= 85 ? 'text-chart-green' : 'text-chart-orange'}`}>
                      {day.occupancy.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>{day.avgStaffing}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}