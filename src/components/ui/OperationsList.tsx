import { useState, useEffect } from "react";
import { OperationCard } from "@/components/ui/OperationCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { SpecialtyFilter } from "@/components/ui/SpecialtyFilter";
import { fine } from "@/lib/fine";
import { Loader2 } from "lucide-react";
import type { Schema } from "@/lib/db-types";

interface OperationsListProps {
  favoritesOnly?: boolean;
}

export function OperationsList({ favoritesOnly = false }: OperationsListProps) {
  const [operations, setOperations] = useState<(Schema["operations"] & { specialtyName: string })[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<(Schema["operations"] & { specialtyName: string })[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const { data: session } = fine.auth.useSession();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch operations
        const operationsData = await fine.table("operations").select("*");
        
        if (operationsData) {
          // Fetch specialties to get names
          const specialties = await fine.table("specialties").select("id, name");
          
          // Map operations with specialty names
          const mappedOperations = operationsData.map(op => {
            const specialty = specialties?.find(s => s.id === op.specialtyId);
            return {
              ...op,
              specialtyName: specialty?.name || "Unknown Specialty"
            };
          });
          
          setOperations(mappedOperations);
          setFilteredOperations(mappedOperations);
        }
        
        // Fetch user favorites
        if (session?.user?.id) {
          const favoritesData = await fine.table("favorites")
            .select("operationId")
            .eq("userId", session.user.id);
          
          if (favoritesData) {
            setFavorites(favoritesData.map(f => f.operationId));
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  useEffect(() => {
    // Apply filters
    let filtered = operations;
    
    // Filter by favorites if needed
    if (favoritesOnly) {
      filtered = filtered.filter(op => favorites.includes(op.id!));
    }
    
    // Filter by specialty
    if (selectedSpecialty !== null) {
      filtered = filtered.filter(op => op.specialtyId === selectedSpecialty);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(op => 
        op.name.toLowerCase().includes(query) || 
        (op.code && op.code.toLowerCase().includes(query)) ||
        (op.description && op.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredOperations(filtered);
  }, [operations, favorites, selectedSpecialty, searchQuery, favoritesOnly]);

  const handleFavoriteToggle = async () => {
    if (session?.user?.id) {
      const favoritesData = await fine.table("favorites")
        .select("operationId")
        .eq("userId", session.user.id);
      
      if (favoritesData) {
        setFavorites(favoritesData.map(f => f.operationId));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-2/3">
          <SearchBar onSearch={setSearchQuery} />
        </div>
        <div className="w-full md:w-1/3">
          <SpecialtyFilter 
            onSelect={setSelectedSpecialty} 
            selectedId={selectedSpecialty}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOperations.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-lg font-medium">No operations found</p>
          <p className="text-sm text-muted-foreground">
            {favoritesOnly 
              ? "You haven't added any operations to your favorites yet." 
              : "Try adjusting your filters or search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOperations.map((operation) => (
            <OperationCard
              key={operation.id}
              operation={operation}
              isFavorite={favorites.includes(operation.id!)}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}