import { useCallback, useState } from "react";
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
import { loadProjects, saveProjects } from "./storage";

export default function FixFlipDealsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [projects, setProjects] = useState<FixFlipProject[]>(() => loadProjects());

  const refresh = useCallback(() => setProjects(loadProjects()), []);

  const handleDelete = (id: number) => {
    if (!confirm(t('dealsPage.deleteConfirm'))) return;
    const next = loadProjects().filter((p) => p.id !== id);
    saveProjects(next);
    refresh();
    toast.success(t('dealsPage.deleted'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Montserrat] text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" />
            {t('dealsPage.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('dealsPage.subtitle')}
          </p>
        </div>
        <Button className="gold-gradient text-primary-foreground" onClick={() => navigate("/calculator")}>
          <Calculator className="h-4 w-4 mr-2" />
          {t('dealsPage.new')}
        </Button>
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
                        <Badge variant={p.dealDecision ? "default" : "destructive"}>
                          {p.dealDecision ? t('dealsPage.positive') : t('dealsPage.negative')}
                        </Badge>
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
