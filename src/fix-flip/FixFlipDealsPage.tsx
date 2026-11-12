import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Pencil, Trash2, Wrench, Calculator } from "lucide-react";
import { formatCurrency, formatPercentage } from "./calculations";
import type { FixFlipProject } from "./types";
import { loadProjects, saveProjects, syncCloudProjects, deleteCloudProject, importLocalDeals } from "./storage";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContent } from "@/lib/portalContent";

export default function FixFlipDealsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("en") ? "en" : "es";
  const portal = usePortalContent("deals", lang);
  const [projects, setProjects] = useState<FixFlipProject[]>(() => loadProjects());
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => setProjects(loadProjects(user?.id)), [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    syncCloudProjects(user.id).then(all => { if (active) setProjects(all); })
      .catch(() => { /* Keep local records available. */ });
    return () => { active = false; };
  }, [user?.id]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('dealsPage.deleteConfirm'))) return;
    if (user?.id) {
      try { await deleteCloudProject(id, user.id); }
      catch {
        toast.error(lang === "es" ? "No se pudo eliminar el registro en la nube." : "Could not delete cloud record.");
        return;
      }
    }
    const next = loadProjects(user?.id).filter((p) => p.id !== id);
    saveProjects(next, user?.id);
    refresh();
    toast.success(t('dealsPage.deleted'));
  };

  const handleImport = async () => {
    if (!user || syncing) return;
    if (!confirm(lang === "es"
      ? "¿Importar a tu cuenta los Deals guardados en este navegador? Hazlo solo si te pertenecen."
      : "Import the Deals saved in this browser to your account? Only proceed if they are yours.")) return;
    setSyncing(true);
    try {
      const count = await importLocalDeals(user.id);
      refresh();
      toast.success(lang === "es" ? count + " inversiones sincronizadas." : count + " deals synchronized.");
    } catch {
      toast.error(lang === "es" ? "No se pudo completar la importación." : "Import failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Montserrat] text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" />
            {portal('title', t('dealsPage.title'))}
          </h1>
          <p className="text-sm text-muted-foreground">
            {portal('subtitle', t('dealsPage.subtitle'))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!user || syncing} onClick={handleImport}>
            {syncing ? (lang === "es" ? "Sincronizando..." : "Synchronizing...") :
              (lang === "es" ? "Importar inversiones de este navegador" : "Import deals from this browser")}
          </Button>
        <Button className="gold-gradient text-primary-foreground" onClick={() => navigate("/calculator")}>
          <Calculator className="h-4 w-4 mr-2" />
          {t('dealsPage.new')}
        </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('dealsPage.list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {t('dealsPage.empty')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dealsPage.project')}</TableHead>
                    <TableHead>{t('dealsPage.address')}</TableHead>
                    <TableHead>{t('dealsPage.investment')}</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>{t('dealsPage.profit')}</TableHead>
                    <TableHead>{t('dealsPage.status')}</TableHead>
                    <TableHead className="text-right">{t('dealsPage.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[140px] truncate">
                        {p.projectName}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {p.propertyAddress}
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        {formatCurrency(p.tpcPlusCost)}
                      </TableCell>
                      <TableCell>{formatPercentage(p.roi)}</TableCell>
                      <TableCell
                        className={
                          p.profit >= 0 ? "text-emerald-500" : "text-destructive"
                        }
                      >
                        {formatCurrency(p.profit)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const roiMet = p.roi >= (p.profitMinPercent || 0);
                          const profitMet = p.profit >= (p.profitMinAmount || 0);
                          const both = roiMet && profitMet;
                          const partial = roiMet !== profitMet;
                          const status = both
                            ? (lang === "es" ? "Cumple objetivos" : "Targets met")
                            : partial
                            ? (lang === "es" ? "Cumple parcialmente" : "Partially meets targets")
                            : (lang === "es" ? "Por debajo de objetivos" : "Below targets");
                          return <Badge variant={both ? "default" : partial ? "secondary" : "destructive"} title={
                            (lang === "es" ? "ROI objetivo: " : "ROI target: ") + formatPercentage(p.profitMinPercent || 0) +
                            " · " + (lang === "es" ? "Ganancia mínima: " : "Minimum profit: ") + formatCurrency(p.profitMinAmount || 0)
                          }>{status}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title={t('dealsPage.manage')}
                            onClick={() => navigate(`/project-manager/${p.id}`)}
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title={t('dealsPage.edit')}
                            onClick={() => navigate(`/calculator?edit=${p.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            title={t('dealsPage.delete')}
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
