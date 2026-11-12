import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, ArrowRight } from "lucide-react";
import { loadProjects, syncCloudProjects } from "./storage";
import { formatCurrency } from "./calculations";
import { usePortalContent } from "@/lib/portalContent";

export default function FixFlipProjectManagerHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const portal = usePortalContent("pm", i18n.language.startsWith("en") ? "en" : "es");
  const [projects, setProjects] = useState(() => loadProjects(user?.id));
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    syncCloudProjects(user.id).then(all => { if (active) setProjects(all); })
      .catch(() => { /* Local projects remain visible. */ });
    return () => { active = false; };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <header className="g360-section-header rounded-[26px] border border-[#d4aa56]/20 bg-gradient-to-br from-[#183958] to-[#07182f] p-6 shadow-[0_16px_50px_rgba(0,0,0,.12)] sm:p-8">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[.22em] text-[#e7bf63]">Global 360 / Fix &amp; Flip</p>
        <h1 className="flex items-center gap-2 font-[Montserrat] text-2xl font-bold text-white sm:text-3xl">
          <HardHat className="h-7 w-7 text-[#e7bf63]" />
          {portal('title', t('pmHub.title'))}
        </h1>
        <p className="mt-3 text-sm text-slate-200/80">
          {portal('subtitle', t('pmHub.subtitle'))}
        </p>
      </header>

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
            <Card key={p.id} className="overflow-hidden rounded-2xl border border-[#d4aa56]/15 bg-gradient-to-br from-[#192c47] to-[#101f35] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-[#e7b95b]/40">
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
