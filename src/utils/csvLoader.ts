// src/utils/csvLoader.ts
import Papa from "papaparse";

// ✅ NOMBRES EXACTOS de los archivos
export const csvMap: Record<string, string> = {
  "Cardiovascular/corazon.csv": "App_cirugias_excel/Cardiovascular/Corazón.csv",
  "Cardiovascular/cardiovascular.csv": "App_cirugias_excel/Cardiovascular/Cardiovascular.csv",
  "VasosPerifericos/vasos.csv": "App_cirugias_excel/Cardiovascular/Vasos_periféricos.csv",
  "Dermatologia/Dermatología.csv": "App_cirugias_excel/Dermatologia/Dermatología.csv",
  "Digestivo/Estómagp_e_intestino.csv": "App_cirugias_excel/Digestivo/Estómago_e_intestino.csv",
  "Digestivo/Peritoneo_y_hernias.csv": "App_cirugias_excel/Digestivo/Peritoneo_y_hernias.csv",
  "Digestivo/Hígado_Páncreas.csv": "App_cirugias_excel/Digestivo/Hígado_Páncreas.csv",
  "Endocrino/Endocrino.csv": "App_cirugias_excel/Endocrino/Endocrino.csv",
  "Ginecología/Ginecología.csv": "App_cirugias_excel/Ginecología/Ginecología.csv",
  "Mama/Mama.csv": "App_cirugias_excel/Mama/Mama.csv",
  "Neurocirugía/Columna_vertebral.csv": "App_cirugias_excel/Neurocirugía/Columna_vertebral.csv",
  "Neurocirugía/Cráneo_y_columna.csv": "App_cirugias_excel/Neurocirugía/Cráneo_y_columna.csv",
  "Obstercia/Obstetricia.csv": "App_cirugias_excel/Obstercia/Obstetricia.csv",
  "Oftamología/Oftalmología.csv": "App_cirugias_excel/Oftamología/Oftalmología.csv",
  "Ortopedia/Cadera.csv": "App_cirugias_excel/Ortopedia/Cadera.csv",
  "Ortopedia/Hombro.csv": "App_cirugias_excel/Ortopedia/Hombro.csv",
  "Ortopedia/Muñeca_y_mano.csv": "App_cirugias_excel/Ortopedia/Muñeca_y_mano.csv",
  "Ortopedia/Pie.csv": "App_cirugias_excel/Ortopedia/Pie.csv",
  "Otorrino/Otorrino.csv": "App_cirugias_excel/Otorrino/Otorrino.csv",
  "Procesos_variados/Cirugía_General.csv": "App_cirugias_excel/Procesos_variados/Cirugía_General.csv",
  "Procesos_variados/Drenajes_incisiones.csv": "App_cirugias_excel/Procesos_variados/Drenajes_incisiones.csv",
  "Procesos_varaidos/Reparaciones_(suturas).csv": "App_cirugias_excel/Procesos_variados/Reparaciones_(suturas).csv",
  "Procesos_varaidos/Uñas___piel.csv": "App_cirugias_excel/Procesos_variados/Uñas___piel.csv",
  "Urologia/Urología.csv": "App_cirugias_excel/Urologia/Urología.csv",
  "Sin_clasificacion/Sin_clasificación.csv": "App_cirugias_excel/Sin_clasificacion/Sin_clasificación.csv",


};

// Función para cargar CSV por ruta relativa dentro de public/
export async function loadCSV(path: string) {
  console.log(`🔍 Intentando cargar: ${path}`);
  
  const url = csvMap[path];
  if (!url) {
    console.error(`❌ Ruta no encontrada en csvMap: ${path}`);
    console.log('📋 Rutas disponibles:', Object.keys(csvMap));
    throw new Error(`CSV no encontrado para la ruta: ${path}`);
  }

  console.log(`📂 Mapeado a: /${url}`);

  try {
    const response = await fetch(`/${url}`);
    
    console.log(`📊 Status: ${response.status} (${response.ok ? 'OK' : 'ERROR'})`);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: No se pudo cargar ${url}`);
    }

    const text = await response.text();
    console.log(`📄 Primeros 200 chars:`, text.substring(0, 200));

    // Verificar que sea CSV y no HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`El archivo ${url} no existe o no es un CSV válido`);
    }

    // Parsear CSV
    const parsed = Papa.parse(text, { 
      header: true, 
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim()
    });

    if (parsed.errors.length > 0) {
      console.warn(`⚠️ Errores al parsear:`, parsed.errors);
    }

    console.log(`✅ CSV parseado exitosamente`);
    console.log(`📊 Total de filas: ${parsed.data.length}`);
    console.log(`📋 Columnas:`, Object.keys(parsed.data[0] || {}));
    console.log(`🔎 Primera fila:`, parsed.data[0]);

    return parsed.data;
    
  } catch (error) {
    console.error(`💥 ERROR:`, error);
    throw error;
  }
}