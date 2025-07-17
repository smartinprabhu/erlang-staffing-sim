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
                <TableHead>Actual</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Call Trend</TableHead>
                <TableHead>AHT</TableHead>
                <TableHead>Service Level</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Influx</TableHead>
                <TableHead>Agent Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.intervalResults.slice(0, 48).map((interval, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{interval.interval}</TableCell>
                  <TableCell>{interval.actual}</TableCell>
                  <TableCell>{interval.required}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${interval.variance >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {interval.variance > 0 ? '+' : ''}{interval.variance}
                    </span>
                  </TableCell>
                  <TableCell>{interval.volume}</TableCell>
                  <TableCell>1560s</TableCell>
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
                  <TableCell>{Math.round(interval.volume * 0.8)}</TableCell>
                  <TableCell>{(interval.actual / (interval.actual + interval.required) * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}