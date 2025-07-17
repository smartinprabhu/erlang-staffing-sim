import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationResults } from "./ContactCenterApp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IntervalTableProps {
  results: SimulationResults;
}

export function IntervalTable({ results }: IntervalTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interval View</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown of each 30-minute interval
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interval</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>AHT</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>SLA %</TableHead>
                <TableHead>Occupancy %</TableHead>
                <TableHead>Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.intervalResults.slice(0, 20).map((interval, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{interval.interval}</TableCell>
                  <TableCell>{interval.volume}</TableCell>
                  <TableCell>1560</TableCell>
                  <TableCell>{interval.required}</TableCell>
                  <TableCell>{interval.actual}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${interval.sla >= 80 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {interval.sla.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${interval.occupancy <= 85 ? 'text-chart-green' : 'text-chart-orange'}`}>
                      {interval.occupancy.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${interval.variance >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {interval.variance > 0 ? '+' : ''}{interval.variance}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}