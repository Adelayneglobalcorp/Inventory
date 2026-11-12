import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type PortalSection = "dashboard" | "inventory" | "calculator" | "deals" | "pm" | "financing";
export type PortalLanguage = "es" | "en";
export type PortalField = {
  section: PortalSection;
  key: string;
  label: { es: string; en: string };
  fallback: { es: string; en: string };
  multiline?: boolean;
};

export const PORTAL_FIELDS: PortalField[] = [
  { section: "dashboard", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Panel principal", en: "Dashboard" } },
  { section: "dashboard", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Resumen de tu actividad e inversiones.", en: "Overview of your activity and investments." }, multiline: true },
  { section: "inventory", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Inventario de propiedades", en: "Property inventory" } },
  { section: "inventory", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Explora las propiedades disponibles.", en: "Explore available properties." }, multiline: true },
  { section: "calculator", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Calculadora Fix & Flip", en: "Fix & Flip Calculator" } },
  { section: "calculator", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Evalúa los números de tu próxima inversión.", en: "Evaluate the numbers behind your next investment." }, multiline: true },
  { section: "deals", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Mis inversiones", en: "My investments" } },
  { section: "deals", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Consulta los análisis guardados.", en: "Review your saved analyses." }, multiline: true },
  { section: "pm", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Gestión de proyectos", en: "Project management" } },
  { section: "pm", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Planifica las tareas y el presupuesto de remodelación.", en: "Plan renovation tasks and budget." }, multiline: true },
  { section: "financing", key: "title", label: { es: "Título", en: "Title" }, fallback: { es: "Solicitar financiamiento", en: "Request financing" } },
  { section: "financing", key: "subtitle", label: { es: "Descripción", en: "Description" }, fallback: { es: "Envía una solicitud de financiamiento para tu inversión inmobiliaria.", en: "Submit a financing request for your real estate investment." }, multiline: true },
  { section: "financing", key: "submit", label: { es: "Botón de envío", en: "Submit button" }, fallback: { es: "Enviar solicitud", en: "Submit request" } },
  { section: "financing", key: "privacy", label: { es: "Aviso del formulario", en: "Form notice" }, fallback: { es: "Los datos de esta solicitud se utilizarán para analizar el financiamiento.", en: "The information submitted will be used to review your financing request." }, multiline: true },
];

export async function loadPortalContent(section: PortalSection, lang: PortalLanguage): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("portal_content")
    .select("field_key,value").eq("section", section).eq("lang", lang);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map(row => [row.field_key, String(row.value ?? "")]));
}

export async function savePortalContent(
  section: PortalSection, lang: PortalLanguage,
  values: Record<string, string>, userId: string,
): Promise<void> {
  const allowed = PORTAL_FIELDS.filter(field => field.section === section);
  const rows = allowed
    .filter(field => (values[field.key] ?? "").trim() !== field.fallback[lang])
    .map(field => ({
      section, lang, field_key: field.key,
      value: (values[field.key] ?? "").trim(),
      updated_by: userId,
    }));
  if (rows.length) {
    const { error } = await supabase.from("portal_content")
      .upsert(rows, { onConflict: "section,field_key,lang" });
    if (error) throw error;
  }
  const keysToReset = allowed
    .filter(field => (values[field.key] ?? "").trim() === field.fallback[lang])
    .map(field => field.key);
  if (keysToReset.length) {
    const { error } = await supabase.from("portal_content")
      .delete().eq("section", section).eq("lang", lang).in("field_key", keysToReset);
    if (error) throw error;
  }
}

export function usePortalContent(section: PortalSection, lang: PortalLanguage) {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    setValues({});
    loadPortalContent(section, lang).then(data => {
      if (mounted) setValues(data);
    }).catch(() => { /* Default text remains available when offline. */ });
    return () => { mounted = false; };
  }, [section, lang]);
  return (key: string, fallback: string) => values[key]?.trim() || fallback;
}
