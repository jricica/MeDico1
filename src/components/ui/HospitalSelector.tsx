import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fine } from "@/lib/fine";
import type { Schema } from "@/lib/db-types";

interface HospitalSelectorProps {
  onSelect: (hospitalId: number) => void;
  selectedId?: number;
}

export function HospitalSelector({ onSelect, selectedId }: HospitalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Schema["hospitals"][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const data = await fine.table("hospitals").select();
        setHospitals(data || []);
      } catch (error) {
        console.error("Failed to fetch hospitals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const selectedHospital = hospitals.find(h => h.id === selectedId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {selectedId && selectedHospital
            ? selectedHospital.name
            : "Select hospital"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search hospital..." />
          <CommandEmpty>No hospital found.</CommandEmpty>
          <CommandGroup>
            {hospitals.map((hospital) => (
              <CommandItem
                key={hospital.id}
                onSelect={() => {
                  onSelect(hospital.id!);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === hospital.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {hospital.name}
                {hospital.location && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({hospital.location})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}