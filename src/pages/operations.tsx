import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { loadCSV } from "@/utils/csvLoader";
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText } from "lucide-react";
import { OperationCard } from "@/components/ui/OperationCard";

// Define tu estructura de carpetas
const folderStructure = {
  Cardiovascular: {
    Corazón: "Cardiovascular/corazon.csv",
    "Cirugía Cardiovascular": "Cardiovascular/cardiovascular.csv",
  },
  "Vasos Periféricos": {
    "Cirugía Vascular": "VasosPerifericos/vasos.csv",
  },
};

const Operations = () => {
  const [csvData, setCsvData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSpecialties, setExpandedSpecialties] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  useEffect(() => {
    async function fetchAllCSV() {
      try {
        const data: Record<string, any[]> = {};
        
        // Cargar todos los CSV según la estructura
        for (const [specialty, subcategories] of Object.entries(folderStructure)) {
          for (const [subName, csvPath] of Object.entries(subcategories)) {
            data[csvPath] = await loadCSV(csvPath);
          }
        }
        
        console.log("Datos CSV cargados:", data);
        setCsvData(data);
      } catch (err: any) {
        console.error("Error al cargar CSV:", err.message);
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
        <div className="flex items-center justify-center h-64">
          <p>Cargando operaciones...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Database</h1>
          <p className="text-muted-foreground">
            Browse all available medical procedures
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de navegación */}
          <div className="lg:col-span-1 space-y-2">
            {Object.entries(folderStructure).map(([specialty, subcategories]) => (
              <div key={specialty} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSpecialty(specialty)}
                  className="w-full flex items-center gap-2 p-3 bg-white hover:bg-gray-50"
                >
                  {expandedSpecialties[specialty] ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Folder className="w-5 h-5" />
                  <span className="font-medium">{specialty}</span>
                </button>

                {expandedSpecialties[specialty] && (
                  <div className="bg-gray-50 border-t">
                    {Object.entries(subcategories).map(([subName, csvPath]) => {
                      const operations = csvData[csvPath] || [];
                      const subKey = `${specialty}-${subName}`;
                      
                      return (
                        <div key={subKey}>
                          <button
                            onClick={() => toggleSubcategory(subKey)}
                            className="w-full flex items-center gap-2 p-2 pl-8 hover:bg-gray-100"
                          >
                            {expandedSubcategories[subKey] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <FolderOpen className="w-4 h-4" />
                            <span className="text-sm">{subName}</span>
                            <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded">
                              {operations.length}
                            </span>
                          </button>

                          {expandedSubcategories[subKey] && (
                            <div className="bg-white">
                              {operations.map((op: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedOperation(op)}
                                  className="w-full text-left p-2 pl-12 text-sm hover:bg-blue-50"
                                >
                                  <FileText className="inline w-3 h-3 mr-2" />
                                  {op.name}
                                </button>
                              ))}
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

          {/* Panel de detalles */}
          <div className="lg:col-span-2">
            {selectedOperation ? (
              <OperationCard 
                operation={selectedOperation}
                isFavorite={false}
              />
            ) : (
              <div className="border rounded-lg p-12 text-center text-muted-foreground">
                <p>Selecciona una operación para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Operations;