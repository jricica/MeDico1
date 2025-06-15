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

interface SpecialtyFilterProps {
  onSelect: (specialtyId: number | null) => void;
  selectedId?: number | null;
}

export function SpecialtyFilter({ onSelect, selectedId }: SpecialtyFilterProps) {
  const [open, setOpen] = useState(false);
  const [specialties, setSpecialties] = useState<Schema["specialties"][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await fine.table("specialties").select();
        setSpecialties(data || []);
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  const selectedSpecialty = specialties.find(s => s.id === selectedId);

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
          {selectedId && selectedSpecialty
            ? selectedSpecialty.name
            : "Filter by specialty"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search specialty..." />
          <CommandEmpty>No specialty found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onSelect(null);
                setOpen(false);
              }}
              className="text-muted-foreground"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !selectedId ? "opacity-100" : "opacity-0"
                )}
              />
              All Specialties
            </CommandItem>
            {specialties.map((specialty) => (
              <CommandItem
                key={specialty.id}
                onSelect={() => {
                  onSelect(specialty.id!);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === specialty.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {specialty.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}