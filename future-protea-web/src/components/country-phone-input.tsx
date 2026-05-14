import { useState, useCallback, useMemo } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { countries, getDefaultCountry, type Country } from '@/data/countries';

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: boolean;
}

export function CountryPhoneInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  placeholder = '98765 43210',
  disabled = false,
  className,
  id,
  error = false,
}: CountryPhoneInputProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.dialCode === countryCode) ?? getDefaultCountry(),
    [countryCode]
  );

  const handleSelect = useCallback(
    (country: Country) => {
      onCountryCodeChange(country.dialCode);
      setOpen(false);
    },
    [onCountryCodeChange]
  );

  return (
    <div className={cn('flex gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[100px] justify-between px-2 shrink-0"
            disabled={disabled}
            type="button"
          >
            <span className="flex items-center gap-1 text-sm">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.dialCode}</span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode}`}
                    onSelect={() => handleSelect(country)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        countryCode === country.dialCode ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="mr-2">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-xs">{country.dialCode}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits.slice(0, 15));
        }}
        maxLength={15}
        disabled={disabled}
        className={cn('flex-1', error && 'border-red-500 focus-visible:ring-red-500')}
      />
    </div>
  );
}
