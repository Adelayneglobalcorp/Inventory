import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PORTAL_FIELDS, loadPortalContent, savePortalContent } from "@/lib/portalContent";
import type { PortalSection, PortalLanguage } from "@/lib/portalContent";

const SECTION_LABELS: Record<PortalSection, { es: string; en: string }> = {
  dashboard: { es: "Inicio", en: "Dashboard" },
  inventory: { es: "Inventario", en: "Inventory" },
  calculator: { es: "Calculadora", en: "Calculator" },
  deals: { es: "Mis inversiones", en: "My investments" },
  pm: { es: "Gestión de proyectos", en: "Project manager" },
  financing: { es: "Financiamiento", en: "Financing" },
};

export default function PortalContentSettings() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const spanish = !i18n.language.startsWith("en");
  const [section, setSection] = useState<PortalSection>("financing");
  const [lang, setLang] = useState<PortalLanguage>(spanish ? "es" : "en");
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fields = useMemo(() => PORTAL_FIELDS.filter(field => field.section === section), [section]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setValues({});
    loadPortalContent(section, lang)
      .then(data => { if (active) setValues(data); })
      .catch(() => { if (active) toast.error(spanish ? "No se pudieron cargar los textos personalizados." : "Could not load custom text."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, lang, spanish]);

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await savePortalContent(section, lang, Object.fromEntries(fields.map(field =>
        [field.key, values[field.key] ?? field.fallback[lang]]
      )), user.id);
      toast.success(spanish ? "Textos publicados. No requiere desplegar Netlify." : "Content saved. No Netlify deploy needed.");
    } catch {
      toast.error(spanish ? "No se pudo guardar. Verifica tus permisos de administrador." : "Could not save. Check your administrator permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-border/70 bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{spanish ? "Configuración de textos del portal" : "Portal content settings"}</h2>
        <p className="text-sm text-muted-foreground">
          {spanish ? "Edita títulos y descripciones sin modificar el código. Cada idioma se administra por separado." :
            "Edit headings and descriptions without code changes. Each language is managed separately."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{spanish ? "Sección" : "Section"}</Label>
          <select value={section} onChange={event => setSection(event.target.value as PortalSection)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {Object.entries(SECTION_LABELS).map(([key, value]) =>
              <option key={key} value={key}>{value[lang]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>{spanish ? "Idioma del contenido" : "Content language"}</Label>
          <select value={lang} onChange={event => setLang(event.target.value as PortalLanguage)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {fields.map(field => {
          const value = values[field.key] ?? field.fallback[lang];
          return <div className="space-y-1.5" key={field.key}>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={"portal-" + field.key}>{field.label[lang]}</Label>
              <Button type="button" size="sm" variant="ghost" onClick={() =>
                setValues(prev => ({ ...prev, [field.key]: field.fallback[lang] }))
              }><RotateCcw className="mr-1 h-3 w-3"/>{spanish ? "Restaurar" : "Reset"}</Button>
            </div>
            {field.multiline
              ? <Textarea id={"portal-" + field.key} value={value} rows={2}
                  onChange={event => setValues(prev => ({ ...prev, [field.key]: event.target.value }))} />
              : <Input id={"portal-" + field.key} value={value} onChange={event =>
                  setValues(prev => ({ ...prev, [field.key]: event.target.value }))} />}
          </div>;
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border/70 pt-3">
        <p className="text-xs text-muted-foreground">{spanish ? "Cambios visibles tras guardar y volver a abrir la sección." : "Changes appear after saving and reopening the section."}</p>
        <Button onClick={save} disabled={!user || loading || saving}><Save className="mr-2 h-4 w-4"/>
          {saving ? (spanish ? "Guardando..." : "Saving...") : (spanish ? "Guardar cambios" : "Save changes")}
        </Button>
      </div>
    </div>
  );
}
