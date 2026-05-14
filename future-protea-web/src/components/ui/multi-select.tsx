import * as React from 'react';
import { X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const remove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal h-auto min-h-9',
            !value.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, i) => (
                <Badge
                  key={value[i]}
                  variant="secondary"
                  className="text-xs px-1.5 py-0"
                >
                  {label}
                  <span
                    className="ml-1 rounded-full outline-none hover:bg-muted-foreground/20 cursor-pointer p-0.5"
                    onClick={(e) => remove(value[i], e)}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <ScrollArea
          className="h-64"
          onWheel={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-none overflow-hidden p-0">
              <div className="p-1">
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => toggle(option.value)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            </CommandList>
          </Command>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
