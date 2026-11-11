import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [projects, setProjects] = useState<FixFlipProject[]>(() => loadProjects());

  const refresh = useCallback(() => setProjects(loadProjects()), []);

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar este deal? / Delete this deal?")) return;
    const next = loadProjects().filter((p) => p.id !== id);
    saveProjects(next);
    refresh();
    toast.success("Deal eliminado / Deal removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[Montserrat] text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" />
            Mis deals
          </h1>
          <p className="text-sm text-muted-foreground">
            Inventario guardado en este navegador (localStorage)
          </p>
        </div>
        <Button className="gold-gradient text-primary-foreground" onClick={() => navigate("/calculator")}>
          <Calculator className="h-4 w-4 mr-2" />
          Nueva calculadora
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Lista de deals</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No hay deals guardados. Usa la calculadora y pulsa &quot;Guardar deal&quot;.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Inversión</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                          {p.dealDecision ? "BUENO" : "MALO"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="Project Manager"
                            onClick={() => navigate(`/project-manager/${p.id}`)}
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="Editar en calculadora"
                            onClick={() => navigate(`/calculator?edit=${p.id}`)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
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
