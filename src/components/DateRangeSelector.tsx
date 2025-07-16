import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Info } from "lucide-react";

interface DateRangeSelectorProps {
  weeks: 4 | 8 | 12;
  fromDate: string;
  toDate: string;
  onWeeksChange: (weeks: 4 | 8 | 12) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

export function DateRangeSelector({
  weeks,
  fromDate,
  toDate,
  onWeeksChange,
  onFromDateChange,
  onToDateChange
}: DateRangeSelectorProps) {
  const calculateDateRange = (selectedWeeks: 4 | 8 | 12) => {
    const from = new Date(fromDate);
    const to = new Date(from);
    to.setDate(to.getDate() + (selectedWeeks * 7) - 1);
    onToDateChange(to.toISOString().split('T')[0]);
    onWeeksChange(selectedWeeks);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Date Range
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <Label>From:</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label>To:</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            ({weeks * 7} days, {weeks} weeks)
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Label>Quick Select:</Label>
            <Button
              variant={weeks === 4 ? "default" : "outline"}
              size="sm"
              onClick={() => calculateDateRange(4)}
            >
              4 Weeks
            </Button>
            <Button
              variant={weeks === 8 ? "default" : "outline"}
              size="sm"
              onClick={() => calculateDateRange(8)}
            >
              8 Weeks
            </Button>
            <Button
              variant={weeks === 12 ? "default" : "outline"}
              size="sm"
              onClick={() => calculateDateRange(12)}
            >
              12 Weeks
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}