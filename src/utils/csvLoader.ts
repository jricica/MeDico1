// src/utils/csvLoader.ts
import Papa from "papaparse";

// Mapea cada CSV a su ruta dentro de public/
export const csvMap: Record<string, string> = {
  "Cardiovascular/corazon.csv": "App_cirugias_excel/Cardiovascular/corazon.csv",
  "Cardiovascular/cardiovascular.csv": "App_cirugias_excel/Cardiovascular/cardiovascular.csv",
  "VasosPerifericos/vasos.csv": "App_cirugias_excel/VasosPerifericos/vasos_perifericos.csv",
};

// Función para cargar CSV por ruta relativa dentro de public/
export async function loadCSV(path: string) {
  const url = csvMap[path];
  if (!url) throw new Error(`CSV no encontrado para la ruta: ${path}`);

  const response = await fetch(`/${url}`); // fetch desde public/
  const text = await response.text();

  // Parsear CSV a array de objetos
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}
