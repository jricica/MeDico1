//OperationsPage.tsx
import { useEffect, useState } from "react";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { loadCSV } from "@/shared/utils/csvLoader";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Star, StarOff, Search, X } from "lucide-react";

interface CSVOperation {
  codigo?: string;
  cirugia?: string;
  rvu?: string;
  especialidad?: string;
  grupo?: string;
  [key: string]: any;
}

const folderStructure = {
  Cardiovascular: {
    "Corazón": "Cardiovascular/Corazón.csv",
    "Vasos Periféricos": "Cardiovascular/Vasos_periféricos.csv",
    "Torax": "Cardiovascular/torax.csv",
  },
  Dermatología: {
    "Dermatología": "Dermatología/Dermatología.csv",
  },
  Digestivo: {
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
  Neurocirugía: {
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
    "Cadera": "Ortopedia/Cadera.csv",
    "Hombro": "Ortopedia/Hombro.csv",
    "Muñeca y Mano": "Ortopedia/Muñeca_y_mano.csv",
    "Pie": "Ortopedia/Pie.csv",
    "Yesos y Ferulas": "Ortopedia/Yesos_y_ferulas.csv",
    "Ortopedia Injertos, Implantes y Replantacion": "Ortopedia/ortopedia_injertos_implantes_replantacion.csv",
    "Artroscopias": "Ortopedia/Artroscopia.csv",
  },
  Otorrino: {
    "Laringe y Traqueas": "Otorrino/Laringe_y_traqueas.csv",
    "Nariz y Senos Paranasales": "Otorrino/Nariz_y_senos_paranasales.csv",
    "Otorrinolaringología": "Otorrino/Otorrinolaringología.csv",
    "Torax": "Otorrino/torax.csv",
  },
  "Procesos Variados": {
    "Cirugía General": "Procesos_variados/Cirugía_General.csv",
    "Drenajes e Incisiones": "Procesos_variados/Drenajes___Incisiones.csv",
    "Reparaciones (Suturas)": "Procesos_variados/Reparaciones_(suturas).csv",
    "Uñas y Piel": "Procesos_variados/Uñas___piel.csv",
  },
  Plastica:{
    "Cirugia Plastica": "Plastica/Plastica.csv",
  },
  Urología: {
    "Urología": "Urología/Urología.csv",
  },
  Maxilofacial: {
    "Maxilofacial": "Maxilofacial/Maxilofacial.csv",
  },
};

// Tarjeta de operación con botón de favoritos
function SimpleOperationCard({ 
  operation, 
  index, 
  highlightCode,
  isFavorite,
  onToggleFavorite
}: { 
  operation: any; 
  index: number; 
  highlightCode?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const codigo = operation?.codigo || 'N/A';
  const cirugia = operation?.cirugia || 'Sin nombre';
  const rvu = operation?.rvu || '0';
  const especialidad = operation?.especialidad || 'N/A';
  const grupo = operation?.grupo || 'N/A';
  
  const isHighlighted = highlightCode && codigo.toLowerCase() === highlightCode.toLowerCase();
  
  return (
    <div className={`border rounded-lg p-4 bg-white shadow hover:shadow-lg transition-all ${isHighlighted ? 'ring-2 ring-yellow-400 bg-yellow-50' : ''}`}>
      {/* Código y botón de favorito */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={onToggleFavorite}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          {isFavorite ? (
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
          ) : (
            <StarOff className="w-5 h-5 text-gray-400" />
          )}
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isHighlighted ? 'bg-yellow-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
          {codigo}
        </span>
      </div>
      
      {/* Título de la cirugía */}
      <h3 className="font-bold text-lg text-gray-900 mb-3">
        {cirugia}
      </h3>
      
      {/* Información */}
      <div className="space-y-2 text-sm text-gray-700">
        <p>
          <span className="font-semibold text-gray-600">Especialidad:</span>{' '}
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            {especialidad}
          </span>
        </p>
        <p>
          <span className="font-semibold text-gray-600">Grupo:</span>{' '}
          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
            {grupo}
          </span>
        </p>
        <p>
          <span className="font-semibold text-gray-600">RVU:</span>{' '}
          <span className="ml-2 bg-green-100 text-green-700 px-3 py-1 rounded font-bold text-base">
            {rvu}
          </span>
        </p>
      </div>
    </div>
  );
}

const OperationsPage = () => {
  const [csvData, setCsvData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpecialties, setExpandedSpecialties] = useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});
  
  // Estados para el buscador
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    operation: any;
    specialty: string;
    subcategory: string;
    csvPath: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estado para favoritos
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Cargar favoritos del localStorage al iniciar
  useEffect(() => {
    const savedFavorites = localStorage.getItem('surgery-favorites');
    if (savedFavorites) {
      try {
        const favArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favArray));
      } catch (e) {
        console.error("Error al cargar favoritos:", e);
      }
    }
  }, []);

  // Guardar favoritos en localStorage cuando cambien
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem('surgery-favorites', JSON.stringify(Array.from(newFavorites)));
    setFavorites(newFavorites);
  };

  // Toggle favorito
  const toggleFavorite = (codigo: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(codigo)) {
      newFavorites.delete(codigo);
    } else {
      newFavorites.add(codigo);
    }
    saveFavorites(newFavorites);
  };

  useEffect(() => {
    async function fetchAllCSV() {
      console.log("🚀 Iniciando carga de CSVs...");
      
      try {
        const data: Record<string, any[]> = {};
        
        for (const [specialty, subcategories] of Object.entries(folderStructure)) {
          for (const [subName, csvPath] of Object.entries(subcategories)) {
            const csvContent = await loadCSV(csvPath);
            data[csvPath] = csvContent;
            console.log(`✅ ${csvPath}: ${csvContent.length} cirugías cargadas`);
          }
        }
        
        console.log("🎉 Todos los CSVs cargados exitosamente");
        setCsvData(data);
        
      } catch (err: any) {
        console.error("💥 ERROR:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAllCSV();
  }, []);

  // Función de búsqueda por coincidencia exacta
  const handleSearch = () => {
    if (!searchCode.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: Array<{
      operation: any;
      specialty: string;
      subcategory: string;
      csvPath: string;
    }> = [];

    const searchTerm = searchCode.trim().toLowerCase();

    console.log(`🔍 Buscando código exacto: "${searchTerm}"`);

    // Buscar en todos los CSVs
    for (const [specialty, subcategories] of Object.entries(folderStructure)) {
      for (const [subcategoryName, csvPath] of Object.entries(subcategories)) {
        const operations = csvData[csvPath] || [];
        
        operations.forEach((op: any) => {
          const opCode = (op?.codigo || '').toLowerCase();
          
          // Verificar coincidencia exacta
          if (opCode === searchTerm) {
            results.push({
              operation: op,
              specialty,
              subcategory: subcategoryName,
              csvPath
            });
          }
        });
      }
    }

    console.log(`✅ Encontrados ${results.length} resultados`);
    setSearchResults(results);

    // Auto-expandir las categorías que tienen resultados
    if (results.length > 0) {
      const newExpandedSpecialties: Record<string, boolean> = {};
      const newExpandedSubcategories: Record<string, boolean> = {};
      
      results.forEach(result => {
        newExpandedSpecialties[result.specialty] = true;
        newExpandedSubcategories[`${result.specialty}-${result.subcategory}`] = true;
      });
      
      setExpandedSpecialties(newExpandedSpecialties);
      setExpandedSubcategories(newExpandedSubcategories);
    }
  };

  const clearSearch = () => {
    setSearchCode("");
    setSearchResults([]);
    setIsSearching(false);
  };

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

  // Filtrar operaciones según búsqueda
  const getFilteredOperations = (csvPath: string) => {
    const operations = csvData[csvPath] || [];
    
    if (!isSearching || searchResults.length === 0) {
      return operations;
    }

    // Mostrar solo las operaciones que están en los resultados de búsqueda
    const resultOps = searchResults
      .filter(r => r.csvPath === csvPath)
      .map(r => r.operation);
    
    return resultOps;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">Cargando cirugías...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 m-8">
          <h2 className="text-2xl font-bold text-red-700 mb-4">❌ Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-2">
            Base de Datos de Cirugías
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-blue-100">
              {Object.values(csvData).reduce((total, ops) => total + ops.length, 0)} cirugías disponibles
            </p>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
              <span className="text-white font-semibold">{favorites.size} favoritos</span>
            </div>
          </div>
        </div>

        {/* Buscador por código */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Buscar por Código</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ej: 33010 (búsqueda exacta)"
                className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              {searchCode && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Buscar
            </button>
          </div>

          {isSearching && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900 font-semibold">
                {searchResults.length > 0 
                  ? `✅ Se encontró${searchResults.length > 1 ? 'ron' : ''} ${searchResults.length} cirugía${searchResults.length > 1 ? 's' : ''}` 
                  : `⚠️ No se encontró ninguna cirugía con el código "${searchCode}"`
                }
              </p>
              {searchResults.length > 0 && (
                <button
                  onClick={clearSearch}
                  className="mt-2 text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  Mostrar todas las cirugías
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navegación por carpetas */}
        <div className="space-y-4">
          {Object.entries(folderStructure).map(([specialty, subcategories]) => {
            // Contar operaciones visibles en esta especialidad
            const visibleOpsCount = Object.values(subcategories)
              .reduce((count, csvPath) => count + getFilteredOperations(csvPath).length, 0);
            
            // Si estamos buscando y no hay resultados en esta especialidad, no mostrarla
            if (isSearching && visibleOpsCount === 0) return null;

            return (
              <div key={specialty} className="border rounded-lg overflow-hidden bg-white shadow-md">
                {/* Especialidad */}
                <button
                  onClick={() => toggleSpecialty(specialty)}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-colors"
                >
                  {expandedSpecialties[specialty] ? (
                    <ChevronDown className="w-6 h-6" />
                  ) : (
                    <ChevronRight className="w-6 h-6" />
                  )}
                  <Folder className="w-6 h-6" />
                  <span className="font-bold text-lg">{specialty}</span>
                  {isSearching && visibleOpsCount > 0 && (
                    <span className="ml-auto bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      {visibleOpsCount} resultado{visibleOpsCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>

                {/* Subcategorías */}
                {expandedSpecialties[specialty] && (
                  <div className="bg-gray-50">
                    {Object.entries(subcategories).map(([subName, csvPath]) => {
                      const operations = getFilteredOperations(csvPath);
                      const subKey = `${specialty}-${subName}`;
                      
                      // Si estamos buscando y no hay resultados en esta subcategoría, no mostrarla
                      if (isSearching && operations.length === 0) return null;
                      
                      return (
                        <div key={subKey} className="border-t">
                          {/* Subcategoría */}
                          <button
                            onClick={() => toggleSubcategory(subKey)}
                            className="w-full flex items-center gap-3 p-3 pl-8 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            {expandedSubcategories[subKey] ? (
                              <ChevronDown className="w-5 h-5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">{subName}</span>
                            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
                              isSearching && operations.length > 0 
                                ? 'bg-yellow-400 text-yellow-900' 
                                : 'bg-blue-600 text-white'
                            }`}>
                              {operations.length}
                            </span>
                          </button>

                          {/* Tarjetas de operaciones */}
                          {expandedSubcategories[subKey] && (
                            <div className="p-6 bg-white">
                              {operations.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                  No hay cirugías en esta categoría
                                </p>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {operations.map((op, idx) => (
                                      <SimpleOperationCard
                                        key={idx}
                                        operation={op}
                                        index={idx}
                                        highlightCode={isSearching ? searchCode : undefined}
                                        isFavorite={favorites.has(op.codigo)}
                                        onToggleFavorite={() => toggleFavorite(op.codigo)}
                                      />
                                    ))}
                                  </div>

                                  <p className="mt-6 text-center text-gray-600 font-semibold">
                                    📊 Mostrando {operations.length} cirugía{operations.length > 1 ? 's' : ''}
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
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default OperationsPage;