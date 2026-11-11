import { scoreToNeedleDegrees } from "../calculations";
import type { DealEvaluation } from "../calculations";
import { ffT } from "../copy";
import type { FixFlipLanguage } from "../types";

type Props = {
  evaluation: DealEvaluation;
  lang: FixFlipLanguage;
};

export function DealGauge({ evaluation, lang }: Props) {
  const t = (k: string) => ffT(lang, k);
  const score = Math.max(0, Math.min(100, evaluation.score || 0));
  const noData = evaluation.levelText === t("evaluateNoData");
  const deg = scoreToNeedleDegrees(score);

  return (
    <div
      className={`rounded-xl border border-border bg-card/80 p-4 ${noData ? "opacity-80" : ""}`}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div className="relative h-[118px] w-[200px] shrink-0">
          <svg
            className="h-full w-full"
            viewBox="0 0 200 118"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <linearGradient id="ffg-poor" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c0392b" />
                <stop offset="100%" stopColor="#e83e8c" />
              </linearGradient>
              <linearGradient id="ffg-fair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fd7e14" />
                <stop offset="100%" stopColor="#ffc107" />
              </linearGradient>
              <linearGradient id="ffg-good" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#138496" />
                <stop offset="100%" stopColor="#007bff" />
              </linearGradient>
              <linearGradient id="ffg-excellent" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#20c997" />
                <stop offset="100%" stopColor="#28a745" />
              </linearGradient>
            </defs>
            <g>
              <path
                d="M 14 100 A 86 86 0 0 1 39.19 39.19 L 63.23 63.23 A 52 52 0 0 0 48 100 Z"
                fill="url(#ffg-poor)"
                opacity={noData || evaluation.level === "poor" ? 1 : 0.35}
              />
              <path
                d="M 39.19 39.19 A 86 86 0 0 1 100 14 L 100 48 A 52 52 0 0 0 63.23 63.23 Z"
                fill="url(#ffg-fair)"
                opacity={noData || evaluation.level === "fair" ? 1 : 0.35}
              />
              <path
                d="M 100 14 A 86 86 0 0 1 160.81 39.19 L 136.77 63.23 A 52 52 0 0 0 100 48 Z"
                fill="url(#ffg-good)"
                opacity={noData || evaluation.level === "good" ? 1 : 0.35}
              />
              <path
                d="M 160.81 39.19 A 86 86 0 0 1 186 100 L 152 100 A 52 52 0 0 0 136.77 63.23 Z"
                fill="url(#ffg-excellent)"
                opacity={noData || evaluation.level === "excellent" ? 1 : 0.35}
              />
            </g>
            <g transform="translate(100,100)">
              <g style={{ transform: `rotate(${deg}deg)`, transformOrigin: "0 0" }}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-76"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="0" cy="0" r="10" fill="hsl(var(--primary))" />
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-muted-foreground">
            <span>{t("gaugePoor")}</span>
            <span>{t("gaugeFair")}</span>
            <span>{t("gaugeGood")}</span>
            <span>{t("gaugeExcellent")}</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <div className="font-[Montserrat] text-4xl font-black text-primary">{score}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("gaugePoints")}</div>
          <div className="mt-1 text-sm font-semibold">{evaluation.levelText}</div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground sm:text-left">
        <span className="mr-1">{evaluation.icon}</span>
        {evaluation.recommendation}
      </p>
    </div>
  );
}
