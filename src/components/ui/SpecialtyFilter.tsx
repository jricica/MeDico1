import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpecialties, setFilteredSpecialties] = useState<Schema["specialties"][]>([]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await fine.table("specialties").select();
        setSpecialties(data || []);
        setFilteredSpecialties(data || []);
      } catch (error) {
        console.error("Failed to fetch specialties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = specialties.filter(specialty => 
        specialty.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSpecialties(filtered);
    } else {
      setFilteredSpecialties(specialties);
    }
  }, [searchQuery, specialties]);

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
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-[300px] overflow-y-auto">
            <div
              className={cn(
                "flex cursor-pointer items-center rounded-md px-2 py-2 text-sm",
                !selectedId ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              )}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              <div className="flex-1">All Specialties</div>
              {!selectedId && (
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              )}
            </div>
            
            {filteredSpecialties.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No specialty found.
              </div>
            ) : (
              filteredSpecialties.map((specialty) => (
                <div
                  key={specialty.id}
                  className={cn(
                    "flex cursor-pointer items-center rounded-md px-2 py-2 text-sm",
                    selectedId === specialty.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => {
                    onSelect(specialty.id!);
                    setOpen(false);
                  }}
                >
                  <div className="flex-1">{specialty.name}</div>
                  {selectedId === specialty.id && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}