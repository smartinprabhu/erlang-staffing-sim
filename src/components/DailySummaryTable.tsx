import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResults } from "./ContactCenterApp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DailySummaryTableProps {
  results: SimulationResults;
}

export function DailySummaryTable({ results }: DailySummaryTableProps) {
  // Generate daily summary data
  const dailySummary = Array.from({ length: 28 }, (_, i) => {
    const baseDate = new Date('2025-06-29');
    baseDate.setDate(baseDate.getDate() + i);
    
    return {
      date: `${baseDate.getDate().toString().padStart(2, '0')}/${(baseDate.getMonth() + 1).toString().padStart(2, '0')}/2025`,
      totalVolume: Math.floor(Math.random() * 2000) + 1000,
      avgSLA: Math.random() * 40 + 60,
      occupancy: Math.random() * 20 + 75,
      avgStaffing: Math.floor(Math.random() * 10) + 15
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