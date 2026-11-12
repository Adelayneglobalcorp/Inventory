import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, ArrowRight } from "lucide-react";
import { loadProjects } from "./storage";
import { formatCurrency } from "./calculations";
import { usePortalContent } from "@/lib/portalContent";

export default function FixFlipProjectManagerHub() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const portal = usePortalContent("pm", i18n.language.startsWith("en") ? "en" : "es");
  const projects = loadProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Montserrat] text-2xl font-bold flex items-center gap-2">
          <HardHat className="h-7 w-7 text-primary" />
          {portal('title', t('pmHub.title'))}
        </h1>
        <p className="text-sm text-muted-foreground">
          {portal('subtitle', t('pmHub.subtitle'))}
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('pmHub.emptyBefore')}{' '}
            <Button variant="link" className="px-1" onClick={() => navigate("/calculator")}>
              {t('pmHub.calculator')}
            </Button>{" "}
            {' '}{t('pmHub.emptyMiddle')}{' '}
            <Button variant="link" className="px-1" onClick={() => navigate("/deals")}>
              {t('pmHub.deals')}
            </Button>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="border-border/80 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{p.projectName}</CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.propertyAddress}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('pmHub.budget')}</span>
                  <span className="font-medium">{formatCurrency(p.rehabBudget)}</span>
                </div>
                <Button
                  className="w-full gold-gradient text-primary-foreground"
                  onClick={() => navigate(`/project-manager/${p.id}`)}
                >
                  {t('pmHub.open')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
