//operations.tsx
import { useEffect, useState } from "react";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { loadCSV } from "@/shared/utils/csvLoader";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Calculator, Star, Stethoscope, X } from "lucide-react";
import { useFavorites } from "@/core/contexts/FavoritesContext";
import { ScrollToTop } from "@/shared/components/ui/scroll-to-top";
import { hospitalService, type Hospital } from "@/services/hospitalService";

// Tipo para las operaciones del CSV
interface CSVOperation {
  codigo?: string;
  cirugia?: string;
  rvu?: string;
  especialidad?: string;
  grupo?: string;
  [key: string]: any;
}

// ✅ Estructura completa sincronizada con csvLoader.ts
const folderStructure = {
  Cardiovascular: {
    "Cardiovascular": "Cardiovascular/Cardiovascular.csv",
    "Corazón": "Cardiovascular/Corazón.csv",
    "Vasos Periféricos": "Cardiovascular/Vasos_periféricos.csv",
    "Tórax": "Cardiovascular/torax.csv",
  },
  Dermatología: {
    "Dermatología": "Dermatología/Dermatología.csv",
  },
  Digestivo: {
    "Digestivo": "Digestivo/Digestivo.csv",
    "Estómago e Intestino": "Digestivo/Estómago_e_intestino.csv",
    "Hígado y Páncreas": "Digestivo/Hígado_Páncreas.csv",
    "Peritoneo y Hernias": "Digestivo/Peritoneo_y_hernias.csv",
  },
  Endocrino: {
    "Endocrino": "Endocrino/Endocrino.csv",
  },
  Ginecología: {
    "Ginecología": "Ginecología/Ginecología.csv",
  },
  Mama: {
    "Mama": "Mama/Mama.csv",
  },
  Maxilofacial: {
    "Maxilofacial": "Maxilofacial/Maxilofacial.csv",
  },
  Neurocirugía: {
    "Neurocirugía": "Neurocirugía/Neurocirugía.csv",
    "Columna": "Neurocirugía/Columna.csv",
    "Cráneo y Columna": "Neurocirugía/Cráneo_y_columna.csv",
  },
  Obstetricia: {
    "Obstetricia": "Obstetricia/Obstetricia.csv",
  },
  Oftalmología: {
    "Oftalmología": "Oftalmología/Oftalmología.csv",
  },
  Ortopedia: {
    "Ortopedia": "Ortopedia/Ortopedia.csv",
    "Cadera": "Ortopedia/Cadera.csv",
    "Hombro": "Ortopedia/Hombro.csv",
    "Muñeca y Mano": "Ortopedia/Muñeca_y_mano.csv",
    "Pie": "Ortopedia/Pie.csv",
    "Yesos y Férulas": "Ortopedia/Yesos_y_ferulas.csv",
    "Injertos, Implantes y Replantación": "Ortopedia/ortopedia_injertos_implantes_replantacion.csv",
    "Artroscopias": "Ortopedia/Artroscopia.csv",
  },
  Otorrino: {
    "Laringe y Tráqueas": "Otorrino/Laringe_y_traqueas.csv",
    "Nariz y Senos Paranasales": "Otorrino/Nariz_y_senos_paranasales.csv",
    "Otorrinolaringología": "Otorrino/Otorrinolaringología.csv",
    "Tórax": "Otorrino/torax.csv",
  },
  Plástica: {
    "Cirugía Plástica": "Plastica/Plastica.csv",
  },
  "Procesos Variados": {
    "Cirugía General": "Procesos_variados/Cirugía_General.csv",
    "Drenajes e Incisiones": "Procesos_variados/Drenajes___Incisiones.csv",
    "Reparaciones (Suturas)": "Procesos_variados/Reparaciones_(suturas).csv",
    "Uñas y Piel": "Procesos_variados/Uñas___piel.csv",
  },
  Urología: {
    "Urología": "Urología/Urología.csv",
  },
};

// Tarjeta de operación
export function SimpleOperationCard({ 
  operation, 
  index, 
  isFavorite, 
  isLoading,
  onToggleFavorite,
  onCalculate
}: { 
  operation: any; 
  index: number;
  isFavorite: boolean;
  isLoading: boolean;
  onToggleFavorite: () => void;
  onCalculate: () => void;
}) {
  const codigo = String(operation?.codigo || 'N/A').trim();
  const cirugia = operation?.cirugia || 'Sin nombre';
  const rvu = operation?.rvu || '0';
  const especialidad = operation?.especialidad || 'N/A';
  const grupo = operation?.grupo || 'N/A';
  
  return (
    <div className="group relative border rounded-lg p-4 bg-card hover:border-primary transition-colors">
      <div className="flex items-start justify-between mb-3">
        <button
          onClick={onToggleFavorite}
          disabled={isLoading}
          className="p-1.5 hover:bg-accent rounded transition-colors disabled:opacity-50"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Star
              className={`w-4 h-4 transition-colors ${
                isFavorite 
                  ? "fill-yellow-500 text-yellow-500" 
                  : "text-muted-foreground hover:text-yellow-500"
              }`}
            />
          )}
        </button>
        <span className="text-xs font-mono text-muted-foreground">
          {codigo}
        </span>
      </div>
      
      <h3 className="font-semibold text-base mb-3 leading-tight min-h-[2.5rem]">
        {cirugia}
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Specialty</span>
          <span className="font-medium">{especialidad}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Group</span>
          <span className="font-medium">{grupo}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-muted-foreground">RVU</span>
          <span className="text-lg font-semibold">{rvu}</span>
        </div>
      </div>

      <button 
        onClick={onCalculate}
        className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Calculator className="w-4 h-4" />
        Calculate Value
      </button>
    </div>
  );
}

const Operations = () => {
  const [csvData, setCsvData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpecialties, setExpandedSpecialties] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [loadingFavorite, setLoadingFavorite] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const itemsPerPage = 24;
  
  // Estados para el modal de cálculo
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  
  // Usar el contexto de favoritos
  const { favorites, toggleFavorite: toggleFavoriteContext } = useFavorites();

  // Toggle favorito usando el contexto
  const handleToggleFavorite = async (codigo: string, operation: any) => {
    const normalizedCode = String(codigo).trim();
    setLoadingFavorite(normalizedCode);
    
    try {
      await toggleFavoriteContext(
        normalizedCode,
        operation?.cirugia || '',
        operation?.especialidad || ''
      );
    } catch (error) {
      alert('Error al actualizar favorito. Por favor intenta de nuevo.');
    } finally {
      setLoadingFavorite(null);
    }
  };

  // Abrir modal de cálculo
  const handleCalculateValue = async (operation: any) => {
    setSelectedOperation(operation);
    setShowCalculateModal(true);
    setCalculatedValue(null);
    setSelectedHospitalId("");
    
    // Cargar hospitales si aún no están cargados
    if (hospitals.length === 0) {
      setLoadingHospitals(true);
      try {
        const data = await hospitalService.getHospitals();
        setHospitals(data);
      } catch (error) {
        console.error('Error loading hospitals:', error);
        alert('Error loading hospitals');
      } finally {
        setLoadingHospitals(false);
      }
    }
  };

  // Calcular valor
  const calculateValue = () => {
    if (!selectedHospitalId || !selectedOperation) return;
    
    const hospital = hospitals.find(h => h.id === parseInt(selectedHospitalId));
    if (!hospital) return;
    
    const rvu = parseFloat(selectedOperation.rvu || 0);
    const multiplier = parseFloat(hospital.rate_multiplier?.toString() || "1");
    const value = rvu * multiplier;
    
    setCalculatedValue(value);
  };

  // Efecto para calcular automáticamente cuando se selecciona un hospital
  useEffect(() => {
    if (selectedHospitalId && selectedOperation) {
      calculateValue();
    }
  }, [selectedHospitalId, selectedOperation]);

  useEffect(() => {
    async function fetchAllCSV() {
      try {
        const data: Record<string, any[]> = {};
        
        for (const [specialty, subcategories] of Object.entries(folderStructure)) {
          for (const [subName, csvPath] of Object.entries(subcategories)) {
            const csvContent = await loadCSV(csvPath);
            data[csvPath] = csvContent;
          }
        }
        
        setCsvData(data);
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCSV();
  }, []);

  const toggleSpecialty = (specialty: string) => {
    setExpandedSpecialties(prev => ({
      ...prev,
      [specialty]: !prev[specialty]
    }));
  };

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Cargando cirugías...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-8 m-8">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">❌ Error</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Search */}
        <div className="space-y-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold mb-1 tracking-tight">Surgery Database</h1>
              <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                <span>{Object.values(csvData).reduce((total, ops) => total + ops.length, 0)} procedures</span>
                {favorites.size > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4" />
                    {favorites.size} favorite{favorites.size !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search all procedures..."
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>
            <select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
              <option value="all">All Specialties</option>
              {Object.keys(folderStructure).map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* All Operations Grid */}
        <div>
          {(() => {
            // Flatten all operations into a single array
            const allOperations: Array<{ op: any; specialty: string; subName: string }> = [];
            
            Object.entries(folderStructure).forEach(([specialty, subcategories]) => {
              // Filter by specialty if selected
              if (specialtyFilter !== "all" && specialty !== specialtyFilter) {
                return;
              }
              
              Object.entries(subcategories).forEach(([subName, csvPath]) => {
                const operations = csvData[csvPath] || [];
                operations.forEach(op => {
                  allOperations.push({ op, specialty, subName });
                });
              });
            });

            // Filter by global search
            const filteredOperations = globalSearch
              ? allOperations.filter(({ op }) =>
                  op?.cirugia?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                  op?.codigo?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                  op?.especialidad?.toLowerCase().includes(globalSearch.toLowerCase())
                )
              : allOperations;

            // Pagination
            const totalPages = Math.ceil(filteredOperations.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedOperations = filteredOperations.slice(startIndex, endIndex);

            if (filteredOperations.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  {globalSearch || specialtyFilter !== "all" ? "No procedures found" : "No procedures available"}
                </div>
              );
            }

            return (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredOperations.length)} of {filteredOperations.length} procedure{filteredOperations.length !== 1 ? 's' : ''}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedOperations.map(({ op, specialty, subName }, idx) => {
                    const codigo = String(op?.codigo || '').trim();
                    const isFav = favorites.has(codigo);

                    return (
                      <SimpleOperationCard
                        key={`${codigo}-${idx}`}
                        operation={op}
                        index={idx}
                        isFavorite={isFav}
                        isLoading={loadingFavorite === codigo}
                        onToggleFavorite={() => handleToggleFavorite(codigo, op)}
                        onCalculate={() => handleCalculateValue(op)}
                      />
                    );
                  })}
                </div>
                {/* Bottom Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Old Navigation - Removed */}
        <div className="hidden space-y-2">
          {Object.entries(folderStructure).map(([specialty, subcategories]) => (
            <div key={specialty} className="border rounded-lg overflow-hidden">
              {/* Specialty */}
              <button
                onClick={() => toggleSpecialty(specialty)}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors"
              >
                {expandedSpecialties[specialty] ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Folder className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-base flex-1 text-left">{specialty}</span>
              </button>

              {/* Subcategories */}
              {expandedSpecialties[specialty] && (
                <div className="bg-muted/30">
                  {Object.entries(subcategories).map(([subName, csvPath]) => {
                    const allOperations = csvData[csvPath] || [];
                    const operations = globalSearch 
                      ? allOperations.filter(op => 
                          op?.cirugia?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          op?.codigo?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          op?.especialidad?.toLowerCase().includes(globalSearch.toLowerCase())
                        )
                      : allOperations;
                    
                    const subKey = `${specialty}-${subName}`;
                    
                    // Auto-expand if there are search results
                    if (globalSearch && operations.length > 0 && !expandedSubcategories[subKey]) {
                      setExpandedSubcategories(prev => ({ ...prev, [subKey]: true }));
                      if (!expandedSpecialties[specialty]) {
                        setExpandedSpecialties(prev => ({ ...prev, [specialty]: true }));
                      }
                    }
                    
                    if (globalSearch && operations.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div key={subKey} className="border-t">
                        {/* Subcategory */}
                        <button
                          onClick={() => toggleSubcategory(subKey)}
                          className="w-full flex items-center gap-3 p-3 pl-8 hover:bg-accent transition-colors"
                        >
                          {expandedSubcategories[subKey] ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1 text-left">{subName}</span>
                          <span className="text-xs text-muted-foreground">
                            {operations.length}
                          </span>
                        </button>

                        {/* Tarjetas de operaciones */}
                        {expandedSubcategories[subKey] && (
                          <div className="p-6 bg-background">
                            {operations.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">
                                No procedures in this category
                              </p>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {operations.map((op, idx) => {
                                    const codigo = String(op?.codigo || '').trim();
                                    const isFav = favorites.has(codigo);
                                    
                                    return (
                                      <SimpleOperationCard
                                        key={idx}
                                        operation={op}
                                        index={idx}
                                        isFavorite={isFav}
                                        isLoading={loadingFavorite === codigo}
                                        onToggleFavorite={() => handleToggleFavorite(codigo, op)}
                                        onCalculate={() => handleCalculateValue(op)}
                                      />
                                    );
                                  })}
                                </div>

                                <p className="mt-6 text-center text-gray-600 dark:text-gray-400 font-semibold">
                                  📊 Mostrando {operations.length} cirugías
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calculate Value Modal */}
      {showCalculateModal && selectedOperation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Calculate Value</h2>
              <button
                onClick={() => setShowCalculateModal(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">{selectedOperation.cirugia}</h3>
                <p className="text-sm text-muted-foreground">Code: {selectedOperation.codigo}</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base RVU</span>
                  <span className="text-lg font-semibold">{selectedOperation.rvu}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Hospital
                </label>
                {loadingHospitals ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <select
                    value={selectedHospitalId}
                    onChange={(e) => setSelectedHospitalId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="">Choose a hospital...</option>
                    {hospitals.map(hospital => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name} ({hospital.rate_multiplier}x)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {calculatedValue !== null && (
                <div className="p-6 bg-primary/10 rounded-lg border-2 border-primary">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Calculated Value</p>
                    <p className="text-3xl font-bold text-primary">
                      ${calculatedValue.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </p>
                    {selectedHospitalId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedOperation.rvu} RVU × {hospitals.find(h => h.id === parseInt(selectedHospitalId))?.rate_multiplier}x
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCalculateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ScrollToTop />
    </AppLayout>
  );
};

export default Operations;