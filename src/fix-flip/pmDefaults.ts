/** Áreas consideradas interior por defecto (igual que `INTERIOR_AREAS` en script.js). */
export const PM_INTERIOR_AREA_NAMES = [
  "Baños",
  "Cocina",
  "Pisos",
  "Pintura",
  "Eléctrico",
  "Plomería",
  "Paredes",
  "Puertas",
  "Ventanas",
] as const;

export type PmSubCost = { materials: number; labor: number; unit: string };

/** Base de datos por defecto de subcategorías (portado de CalculatorFix-flip/script.js). */
export const PM_SUBCATEGORY_DATABASE_DEFAULT: Record<string, Record<string, PmSubCost>> = {
  Baños: {
    "Reemplazar inodoro": { materials: 150, labor: 200, unit: "EACH" },
    "Reemplazar lavamanos": { materials: 120, labor: 150, unit: "EACH" },
    "Reemplazar regadera": { materials: 300, labor: 400, unit: "EACH" },
    "Reemplazar tina": { materials: 400, labor: 500, unit: "EACH" },
    "Reemplazar accesorios": { materials: 80, labor: 100, unit: "EACH" },
    "Instalar mampara": { materials: 250, labor: 300, unit: "EACH" },
    "Reparar fuga": { materials: 50, labor: 150, unit: "EACH" },
    "Cambiar azulejos": { materials: 8, labor: 12, unit: "SQFT" },
    "Instalar gabinete": { materials: 200, labor: 250, unit: "EACH" },
    "Instalar espejo": { materials: 100, labor: 80, unit: "EACH" },
    "Instalar ventilador": { materials: 80, labor: 120, unit: "EACH" },
    "Pintar baño": { materials: 2, labor: 3, unit: "SQFT" },
  },
  Cocina: {
    "Reemplazar gabinetes superiores": { materials: 150, labor: 200, unit: "LINEAR_FT" },
    "Reemplazar gabinetes inferiores": { materials: 200, labor: 250, unit: "LINEAR_FT" },
    "Instalar countertop": { materials: 40, labor: 60, unit: "SQFT" },
    "Reemplazar fregadero": { materials: 250, labor: 200, unit: "EACH" },
    "Instalar grifo": { materials: 120, labor: 150, unit: "EACH" },
    "Reemplazar electrodomésticos": { materials: 800, labor: 200, unit: "EACH" },
    "Instalar isla": { materials: 500, labor: 400, unit: "EACH" },
    "Instalar backsplash": { materials: 15, labor: 25, unit: "SQFT" },
    "Reemplazar piso": { materials: 5, labor: 8, unit: "SQFT" },
    "Instalar iluminación bajo gabinetes": { materials: 100, labor: 150, unit: "LINEAR_FT" },
    "Pintar cocina": { materials: 2, labor: 3, unit: "SQFT" },
  },
  Pisos: {
    "Instalar piso flotante": { materials: 3, labor: 5, unit: "SQFT" },
    "Instalar baldosas": { materials: 4, labor: 8, unit: "SQFT" },
    "Instalar madera": { materials: 8, labor: 10, unit: "SQFT" },
    "Instalar alfombra": { materials: 3, labor: 4, unit: "SQFT" },
    "Nivelar piso": { materials: 2, labor: 6, unit: "SQFT" },
    "Instalar baseboards": { materials: 3, labor: 5, unit: "LINEAR_FT" },
    "Reparar piso existente": { materials: 50, labor: 100, unit: "SQFT" },
  },
  Pintura: {
    "Pintar paredes": { materials: 1, labor: 2, unit: "SQFT" },
    "Pintar techo": { materials: 0.8, labor: 1.5, unit: "SQFT" },
    "Pintar molduras": { materials: 2, labor: 3, unit: "LINEAR_FT" },
    "Pintar puertas": { materials: 25, labor: 50, unit: "EACH" },
    "Preparar superficies": { materials: 0.5, labor: 3, unit: "SQFT" },
    "Remover papel pintado": { materials: 1, labor: 4, unit: "SQFT" },
  },
  Eléctrico: {
    "Reemplazar panel eléctrico": { materials: 800, labor: 600, unit: "EACH" },
    "Instalar tomacorrientes": { materials: 20, labor: 80, unit: "EACH" },
    "Instalar interruptores": { materials: 15, labor: 60, unit: "EACH" },
    "Instalar plafones": { materials: 40, labor: 100, unit: "EACH" },
    "Instalar luces empotradas": { materials: 80, labor: 150, unit: "EACH" },
    "Cableado nuevo": { materials: 2, labor: 8, unit: "LINEAR_FT" },
    "Instalar breaker": { materials: 25, labor: 100, unit: "EACH" },
  },
  Plomería: {
    "Reemplazar tuberías": { materials: 5, labor: 15, unit: "LINEAR_FT" },
    "Instalar calentador": { materials: 600, labor: 400, unit: "EACH" },
    "Reparar fuga": { materials: 50, labor: 200, unit: "EACH" },
    "Instalar válvulas": { materials: 80, labor: 120, unit: "EACH" },
    "Limpiar drenajes": { materials: 0, labor: 150, unit: "EACH" },
    "Instalar bomba de agua": { materials: 400, labor: 300, unit: "EACH" },
  },
  Paredes: {
    "Reparar drywall / paneles": { materials: 40, labor: 120, unit: "SQFT" },
    "Instalar drywall nuevo": { materials: 35, labor: 45, unit: "SQFT" },
    "Texturizar y lijar": { materials: 8, labor: 15, unit: "SQFT" },
    "Instalar molduras / cornisas": { materials: 5, labor: 12, unit: "LINEAR_FT" },
  },
  Puertas: {
    "Ajustar o reparar puerta existente": { materials: 40, labor: 120, unit: "EACH" },
    "Reemplazar puerta interior": { materials: 180, labor: 220, unit: "EACH" },
    "Reemplazar marco / casing": { materials: 120, labor: 200, unit: "EACH" },
    "Instalar cerradura y herrajes": { materials: 80, labor: 100, unit: "EACH" },
  },
  Ventanas: {
    "Reparar marco o bisagras": { materials: 60, labor: 150, unit: "EACH" },
    "Reemplazar ventana": { materials: 350, labor: 400, unit: "EACH" },
    "Instalar persianas o cortinas": { materials: 200, labor: 180, unit: "EACH" },
    "Sellado e impermeabilización": { materials: 25, labor: 80, unit: "LINEAR_FT" },
  },
  Techo: {
    "Reemplazar tejas asfálticas": { materials: 2.5, labor: 3, unit: "SQFT" },
    "Reemplazar tejas metálicas": { materials: 4, labor: 4, unit: "SQFT" },
    "Reparar goteras": { materials: 100, labor: 300, unit: "EACH" },
    "Limpiar canaletas": { materials: 0, labor: 150, unit: "EACH" },
    "Reemplazar canaletas": { materials: 8, labor: 10, unit: "LINEAR_FT" },
    "Instalar ventilación": { materials: 200, labor: 250, unit: "EACH" },
  },
  "Jardín y paisajismo": {
    "Preparar y limpiar terreno": { materials: 0, labor: 0, unit: "SQFT" },
    "Colocar césped": { materials: 0, labor: 0, unit: "SQFT" },
    "Podar árboles y arbustos": { materials: 0, labor: 0, unit: "EACH" },
    "Instalar plantas y jardineras": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar sistema de riego": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Entrada y driveway": {
    "Reparar concreto": { materials: 0, labor: 0, unit: "SQFT" },
    "Pavimentar entrada": { materials: 0, labor: 0, unit: "SQFT" },
    "Lavar a presión": { materials: 0, labor: 0, unit: "SQFT" },
    "Sellar asfalto o concreto": { materials: 0, labor: 0, unit: "SQFT" },
  },
  "Patio y terraza": {
    "Reparar deck": { materials: 0, labor: 0, unit: "SQFT" },
    "Reemplazar piso exterior": { materials: 0, labor: 0, unit: "SQFT" },
    "Reparar pérgola": { materials: 0, labor: 0, unit: "EACH" },
    "Pintar terraza": { materials: 0, labor: 0, unit: "SQFT" },
  },
  "Cercas y portones": {
    "Reparar cerca": { materials: 0, labor: 0, unit: "LINEAR_FT" },
    "Instalar cerca": { materials: 0, labor: 0, unit: "LINEAR_FT" },
    "Pintar cerca": { materials: 0, labor: 0, unit: "LINEAR_FT" },
    "Reparar portón": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Garaje": {
    "Reemplazar puerta de garaje": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar motor y sensores": { materials: 0, labor: 0, unit: "EACH" },
    "Recubrir piso": { materials: 0, labor: 0, unit: "SQFT" },
    "Actualizar iluminación": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Piscina y spa": {
    "Inspeccionar piscina": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar bomba y filtro": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar revestimiento": { materials: 0, labor: 0, unit: "SQFT" },
    "Limpiar piscina": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Drenaje exterior": {
    "Nivelación de terreno": { materials: 0, labor: 0, unit: "SQFT" },
    "Instalar drenaje francés": { materials: 0, labor: 0, unit: "LINEAR_FT" },
    "Reparar desagüe": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Iluminación exterior": {
    "Instalar luminarias": { materials: 0, labor: 0, unit: "EACH" },
    "Instalar sensores": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar cableado": { materials: 0, labor: 0, unit: "LINEAR_FT" },
  },
  "Puertas y ventanas exteriores": {
    "Reemplazar puerta exterior": { materials: 0, labor: 0, unit: "EACH" },
    "Sellar ventanas": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar marcos": { materials: 0, labor: 0, unit: "EACH" },
    "Instalar protección contra tormentas": { materials: 0, labor: 0, unit: "EACH" },
  },
  "HVAC exterior": {
    "Inspeccionar unidad condensadora": { materials: 0, labor: 0, unit: "EACH" },
    "Reparar conexiones": { materials: 0, labor: 0, unit: "EACH" },
    "Reemplazar condensador": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Seguridad y permisos": {
    "Revisar cumplimiento de códigos": { materials: 0, labor: 0, unit: "EACH" },
    "Solicitar inspección": { materials: 0, labor: 0, unit: "EACH" },
    "Retirar escombros": { materials: 0, labor: 0, unit: "EACH" },
  },
  "Paredes Exteriores/Fachada": {
    "Repintar fachada": { materials: 1.5, labor: 3, unit: "SQFT" },
    "Reparar estuco": { materials: 3, labor: 8, unit: "SQFT" },
    "Reemplazar siding": { materials: 4, labor: 6, unit: "SQFT" },
    "Limpiar fachada": { materials: 0.5, labor: 2, unit: "SQFT" },
    "Sellar grietas": { materials: 2, labor: 5, unit: "LINEAR_FT" },
    "Instalar aislamiento exterior": { materials: 2, labor: 4, unit: "SQFT" },
  },
};

const interiorSet = new Set<string>(PM_INTERIOR_AREA_NAMES);

export function defaultCategoryForArea(area: string): "INTERIOR" | "EXTERIOR" {
  return interiorSet.has(area) ? "INTERIOR" : "EXTERIOR";
}

/** UI labels only. Keys stored in existing projects remain unchanged. */
export const PM_AREA_LABELS_EN: Record<string, string> = {
  "Baños": "Bathrooms", "Cocina": "Kitchen", "Pisos": "Floors",
  "Pintura": "Painting", "Eléctrico": "Electrical", "Plomería": "Plumbing",
  "Paredes": "Walls", "Puertas": "Doors", "Ventanas": "Windows",
  "Techo": "Roof", "Paredes Exteriores/Fachada": "Exterior walls / Facade",
  "Jardín y paisajismo": "Landscaping", "Entrada y driveway": "Driveway",
  "Patio y terraza": "Patio and deck", "Cercas y portones": "Fences and gates",
  "Garaje": "Garage", "Piscina y spa": "Pool and spa",
  "Drenaje exterior": "Exterior drainage", "Iluminación exterior": "Outdoor lighting",
  "Puertas y ventanas exteriores": "Exterior doors and windows",
  "HVAC exterior": "Outdoor HVAC", "Seguridad y permisos": "Safety and permits",
  "Sala": "Living room",
};
export function pmDisplayArea(area: string, english: boolean): string {
  if (!english) return area;
  const bathroom = /^Baño (\d+)$/.exec(area);
  if (bathroom) return "Bathroom " + bathroom[1];
  const bedroom = /^Habitación (\d+)$/.exec(area);
  if (bedroom) return "Bedroom " + bedroom[1];
  return PM_AREA_LABELS_EN[area] ?? area;
}
