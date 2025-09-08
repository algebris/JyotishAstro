import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormControl, FormMessage } from '@/components/ui/form';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Location } from '@shared/schema';

interface LocationSearchProps {
  value?: string | null;
  onChange: (locationId: string | null) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function LocationSearch({ 
  value, 
  onChange, 
  placeholder = "Поиск места рождения...", 
  required = false,
  className 
}: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Получить выбранную локацию по ID
  const { data: currentLocation } = useQuery<Location>({
    queryKey: ['/api/locations', value],
    enabled: !!value && value !== selectedLocation?.id,
  });

  // Поиск локаций с дебаунсом
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations/search', search],
    enabled: search.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Обновить selectedLocation когда получили currentLocation
  useEffect(() => {
    if (currentLocation && currentLocation.id === value) {
      setSelectedLocation(currentLocation);
    }
  }, [currentLocation, value]);

  // Обработчик выбора локации
  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    onChange(location.id);
    setOpen(false);
    setSearch('');
  };

  // Обработчик очистки
  const handleClear = () => {
    setSelectedLocation(null);
    onChange(null);
    setSearch('');
  };

  // Форматирование координат
  const formatCoordinates = (lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const latDir = latNum >= 0 ? 'N' : 'S';
    const lngDir = lngNum >= 0 ? 'E' : 'W';
    
    return `${Math.abs(latNum).toFixed(2)}°${latDir}, ${Math.abs(lngNum).toFixed(2)}°${lngDir}`;
  };

  // Форматирование временной зоны
  const formatTimezone = (timezone: string, utcOffset: number) => {
    const hours = Math.floor(Math.abs(utcOffset) / 60);
    const minutes = Math.abs(utcOffset) % 60;
    const sign = utcOffset >= 0 ? '+' : '-';
    const offsetStr = `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${timezone} (${offsetStr})`;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid="location-search-trigger"
          >
            {selectedLocation ? (
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{selectedLocation.displayName}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" data-testid="location-search-popover">
          <Command>
            <CommandInput
              placeholder="Введите название города или места..."
              value={search}
              onValueChange={setSearch}
              data-testid="location-search-input"
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Поиск..." : search.length < 2 ? "Введите минимум 2 символа" : "Места не найдены"}
              </CommandEmpty>
              {locations.length > 0 && (
                <CommandGroup>
                  {locations.map((location: Location) => (
                    <CommandItem
                      key={location.id}
                      value={location.displayName}
                      onSelect={() => handleSelectLocation(location)}
                      className="flex flex-col items-start gap-1 p-3"
                      data-testid={`location-option-${location.id}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedLocation?.id === location.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{location.displayName}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {formatCoordinates(location.latitude, location.longitude)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimezone(location.timezone, location.utcOffset)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedLocation && (
        <div className="mt-2 p-3 bg-muted rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-sm">{selectedLocation.displayName}</div>
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <div>Координаты: {formatCoordinates(selectedLocation.latitude, selectedLocation.longitude)}</div>
                <div>Часовой пояс: {formatTimezone(selectedLocation.timezone, selectedLocation.utcOffset)}</div>
                {selectedLocation.country && (
                  <div>Страна: {selectedLocation.country}</div>
                )}
                {selectedLocation.region && (
                  <div>Регион: {selectedLocation.region}</div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
              data-testid="location-clear-button"
            >
              Очистить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface LocationFormFieldProps {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function LocationFormField({ 
  control, 
  name, 
  label, 
  placeholder, 
  required = false,
  className 
}: LocationFormFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div className={className}>
          <Label htmlFor={name}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <FormControl>
            <LocationSearch
              value={field.value}
              onChange={field.onChange}
              placeholder={placeholder}
              required={required}
            />
          </FormControl>
          <FormMessage />
        </div>
      )}
    />
  );
}