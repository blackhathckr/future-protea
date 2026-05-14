import { memo, useState } from 'react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CourseAdminService } from '@/services/admin';
import type { ReportFilters as ReportFiltersType } from '../data/types';

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onChange: (filters: ReportFiltersType) => void;
}

const STATUSES = ['Active', 'Inactive'];

export const ReportFilters = memo(function ReportFilters({
  filters,
  onChange,
}: ReportFiltersProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : subDays(new Date(), 30)
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : new Date()
  );

  const categories: Array<{ id: string; name: string }> = [];

  const handleApply = () => {
    onChange({
      ...filters,
      dateFrom: fromDate ? format(fromDate, 'yyyy-MM-dd') : '',
      dateTo: toDate ? format(toDate, 'yyyy-MM-dd') : '',
    });
  };

  const handleQuickRange = (from: Date) => {
    const to = new Date();
    setFromDate(from);
    setToDate(to);
    onChange({
      ...filters,
      dateFrom: format(from, 'yyyy-MM-dd'),
      dateTo: format(to, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[200px] justify-start text-left font-normal',
                !fromDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={setFromDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-[200px] justify-start text-left font-normal',
                !toDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, 'MMM dd, yyyy') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={setToDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.category ?? 'all'}
          onValueChange={(v) => onChange({ ...filters, category: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? 'all'}
          onValueChange={(v) => onChange({ ...filters, status: v === 'all' ? undefined : v })}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleApply} size="sm" className="col-span-2 sm:col-span-auto w-full sm:w-auto">
          Apply
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickRange(subDays(new Date(), 7))}
          className="text-xs sm:text-sm"
        >
          Last 7 days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickRange(subDays(new Date(), 30))}
          className="text-xs sm:text-sm"
        >
          Last 30 days
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickRange(subMonths(new Date(), 3))}
          className="text-xs sm:text-sm"
        >
          Last 3 months
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickRange(subYears(new Date(), 1))}
          className="text-xs sm:text-sm"
        >
          Last year
        </Button>
      </div>
    </div>
  );
});
