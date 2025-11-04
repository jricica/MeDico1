import pandas as pd
import os
import re
from collections import Counter

# -----------------------------
# CONFIG: ruta del archivo base
# -----------------------------
archivo_base = r"C:\Users\nacho\OneDrive\Documentos\GitHub\MeDico1\public\App_cirugias_excel\Ortopedia.csv"

# -----------------------------
# Cargar CSV (todo como texto)
# -----------------------------
df = pd.read_csv(archivo_base, dtype=str, keep_default_na=False)

# Normalizar nombres de columnas
df.columns = [c.strip().upper() for c in df.columns]

# Chequeo básico
required = ['CPT', 'DESCRIPTION', 'RVU']
if not all(col in df.columns for col in required):
    raise ValueError(f"Faltan columnas. Encontradas: {df.columns.tolist()}  -> se requieren: {required}")

# -----------------------------
# Función para extraer CPT como texto sin decimales
# -----------------------------
def extract_cpt_raw(val):
    s = str(val).strip()
    # si ya es algo tipo "26010" o "26010.0" o "26010,0"
    # vamos a buscar 4-5 dígitos consecutivos
    m = re.search(r'(\d{4,5})', s)
    return m.group(1) if m else None

# Aplicar extracción
df['CPT_RAW'] = df['CPT'].apply(extract_cpt_raw)

# Convertir a int para operaciones numéricas cuando exista
df['CPT_INT'] = pd.to_numeric(df['CPT_RAW'], errors='coerce').astype('Int64')

# -----------------------------
# Diagnóstico (impreso para que veas qué hay)
# -----------------------------
print("\n=== DIAGNÓSTICO RÁPIDO ===")
print("Total filas originales:", len(df))
print("Filas con CPT extraído:", df['CPT_RAW'].notna().sum())
print("Primeras 30 CPT_RAW únicas (ordenadas):")
print(sorted(set(x for x in df['CPT_RAW'].dropna()))[:30])
print("\nCPT_INT min, max, nulos:")
print("min:", int(df['CPT_INT'].min()) if df['CPT_INT'].notna().any() else None)
print("max:", int(df['CPT_INT'].max()) if df['CPT_INT'].notna().any() else None)
print("nulos CPT_INT:", df['CPT_INT'].isna().sum())

# Mostrar distribución por bloques de 100 (ejemplo)
df_valid = df[df['CPT_INT'].notna()].copy()
df_valid['block100'] = (df_valid['CPT_INT'] // 100) * 100
cnt = Counter(df_valid['block100'].astype(int).tolist())
print("\nDistribución por bloque 100 (block_start:count) — solo bloques con >0:")
for k in sorted(cnt.keys()):
    print(f"{k}: {cnt[k]}")

# Imprimir primeros 20 registros problemáticos (sin CPT)
if df[df['CPT_RAW'].isna()].shape[0] > 0:
    print("\nPrimeras 10 filas SIN CPT reconocible (revisar formato):")
    print(df[df['CPT_RAW'].isna()].head(10)[['CPT','DESCRIPTION','RVU']].to_string(index=False))

# -----------------------------
# RANGOS DE CLASIFICACIÓN (ajustables)
# -----------------------------
rangos = {
    "Muñeca_y_mano": (26000, 26999),
    "Cadera": (26990, 27299),          # incluye 26990-26992 y 27000-27299
    "Hombro": (23000, 23999),
    "Codo_y_antebrazo": (24000, 24999),
    "Rodilla": (27400, 27499),
    "Fémur_y_pierna": (27200, 27599),
    "Tobillo_y_pie": (27600, 27999),
    "Columna": (22000, 22999),
}

# -----------------------------
# Clasificar filas en grupos
# -----------------------------
# columna para marcar grupo asignado
df['GRUPO_ASIGNADO'] = None

for grupo, (inicio, fin) in rangos.items():
    mask = (df['CPT_INT'].notna()) & (df['CPT_INT'] >= inicio) & (df['CPT_INT'] <= fin)
    df.loc[mask, 'GRUPO_ASIGNADO'] = grupo

# Aquellos sin grupo irán a 'Otros'
df['GRUPO_ASIGNADO'] = df['GRUPO_ASIGNADO'].fillna('Otros')

# -----------------------------
# Preparar salidas y carpetas
# -----------------------------
base_path = os.path.dirname(archivo_base)
os.makedirs(base_path, exist_ok=True)

# Campos de salida: CPT (sin decimal), DESCRIPTION, RVU, ESPECIALIDAD, GRUPO
def preparar_salida(subdf):
    # Usar CPT_RAW (texto sin .0), DESCRIPTION y RVU originales
    out = pd.DataFrame({
        'codigo': subdf['CPT_RAW'],
        'cirugia': subdf['DESCRIPTION'],
        'rvu': subdf['RVU'],
        'especialidad': 'Ortopedia',
        'grupo': subdf['GRUPO_ASIGNADO']
    })
    # Eliminar filas sin codigo
    out = out[out['codigo'].notna()]
    return out

# Guardar cada grupo como CSV (sobrescribir si existe)
grupos_presentes = df['GRUPO_ASIGNADO'].unique().tolist()
print("\nGrupos detectados en el archivo:", grupos_presentes)

resumen = []
for grupo in sorted(df['GRUPO_ASIGNADO'].unique()):
    sub = df[df['GRUPO_ASIGNADO'] == grupo]
    out = preparar_salida(sub)
    nombre = f"{grupo}.csv"
    ruta = os.path.join(base_path, nombre)
    # eliminar si existe
    if os.path.exists(ruta):
        os.remove(ruta)
    out.to_csv(ruta, index=False, encoding='utf-8-sig', header=True)
    print(f"→ Guardado '{ruta}' ({len(out)} registros)")
    resumen.append((grupo, len(out)))

# -----------------------------
# Mostrar resumen final
# -----------------------------
print("\n=== RESUMEN FINAL ===")
total_guardados = sum(count for _, count in resumen)
for g, c in resumen:
    print(f"{g}: {c}")
print(f"Total guardado: {total_guardados} filas (de {len(df)} filas originales)")

# Mostrar primeros 10 de 'Otros' para que revises
if any(g == 'Otros' and c > 0 for g, c in resumen):
    print("\nPrimeras 20 filas clasificadas como 'Otros' (revisa si deben pertenecer a un grupo):")
    print(preparar_salida(df[df['GRUPO_ASIGNADO']=='Otros']).head(20).to_string(index=False))
