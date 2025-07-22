
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onDateRangeChange: (fromDate: string, toDate: string) => void;
}

export function DateRangePicker({ fromDate, toDate, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFromDate, setTempFromDate] = useState<Date>(new Date(fromDate));
  const [tempToDate, setTempToDate] = useState<Date>(new Date(toDate));

  const handleApply = () => {
    onDateRangeChange(
      tempFromDate.toISOString().split('T')[0],
      tempToDate.toISOString().split('T')[0]
    );
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempFromDate(new Date(fromDate));
    setTempToDate(new Date(toDate));
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            "text-sm"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(new Date(fromDate), "MMM dd")} - {format(new Date(toDate), "MMM dd, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="p-3">
            <div className="text-sm font-medium mb-2">From Date</div>
            <Calendar
              mode="single"
              selected={tempFromDate}
              onSelect={(date) => date && setTempFromDate(date)}
              className={cn("pointer-events-auto")}
            />
          </div>
          <div className="p-3 border-l">
            <div className="text-sm font-medium mb-2">To Date</div>
            <Calendar
              mode="single"
              selected={tempToDate}
              onSelect={(date) => date && setTempToDate(date)}
              className={cn("pointer-events-auto")}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 border-t">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
