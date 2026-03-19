import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateDentalChart } from "@/features/dental-chart/data";
import { Tooth } from "./Tooth";
import { ToothDetail } from "./ToothDetail";
import { DentalChartSkeleton } from "@/shared/components/PageSkeleton";
import type { ToothData, ToothStatus } from "../types";
import { toast } from "@/hooks/use-toast";

const statusBadge: Record<ToothStatus, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  cavity: "bg-destructive/10 text-destructive border-destructive/20",
  filled: "bg-warning/10 text-warning border-warning/20",
  missing: "bg-muted text-muted-foreground border-border",
  implant: "bg-info/10 text-info border-info/20",
};

const statuses: ToothStatus[] = ["healthy", "cavity", "filled", "missing", "implant"];

const DentalChartPage = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [teeth, setTeeth] = useState<ToothData[]>(() => generateDentalChart());
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const upperTeeth = teeth.filter((tooth) => tooth.id >= 1 && tooth.id <= 16);
  const lowerTeeth = teeth.filter((tooth) => tooth.id >= 17 && tooth.id <= 32);

  const setToothStatus = (id: number, status: ToothStatus) => {
    setTeeth((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (selectedTooth?.id === id) {
      setSelectedTooth((prev) => (prev ? { ...prev, status } : null));
    }
    toast({ title: t("common.success"), description: t("dental.statusChanged") });
  };

  const statusLabels: Record<ToothStatus, string> = {
    healthy: t("dental.healthy"),
    cavity: t("dental.cavity"),
    filled: t("dental.filled"),
    missing: t("dental.missing"),
    implant: t("dental.implant"),
  };

  if (loading) {
    return (
      <AppLayout>
        <DentalChartSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold">{t("dental.title")}</h1>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          {statuses.map((s) => (
            <div key={s} className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-medium ${statusBadge[s]}`}>
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: `hsl(var(--tooth-${s}))` }} />
              {statusLabels[s]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">{t("dental.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center overflow-x-auto">
              <svg width="640" height="260" viewBox="0 0 640 260" className="w-full max-w-[640px] min-w-[320px]">
                <text x="320" y="20" textAnchor="middle" className="fill-muted-foreground text-xs" style={{ fontSize: "11px" }}>
                  {t("dental.upper")}
                </text>
                {upperTeeth.map((tooth, i) => (
                  <Tooth
                    key={tooth.id}
                    data={tooth}
                    x={10 + i * 39}
                    y={30}
                    selected={selectedTooth?.id === tooth.id}
                    onClick={() => setSelectedTooth(tooth)}
                  />
                ))}
                <line x1={10 + 8 * 39 - 1} y1={25} x2={10 + 8 * 39 - 1} y2={80} className="stroke-border stroke-[1]" strokeDasharray="4 2" />
                <text x="320" y="115" textAnchor="middle" className="fill-muted-foreground text-xs" style={{ fontSize: "11px" }}>
                  {t("dental.lower")}
                </text>
                {lowerTeeth.map((tooth, i) => (
                  <Tooth
                    key={tooth.id}
                    data={tooth}
                    x={10 + i * 39}
                    y={125}
                    selected={selectedTooth?.id === tooth.id}
                    onClick={() => setSelectedTooth(tooth)}
                  />
                ))}
                <line x1={10 + 8 * 39 - 1} y1={120} x2={10 + 8 * 39 - 1} y2={175} className="stroke-border stroke-[1]" strokeDasharray="4 2" />
              </svg>
            </CardContent>
          </Card>

          <ToothDetail tooth={selectedTooth} onChangeStatus={setToothStatus} />
        </div>
      </div>
    </AppLayout>
  );
};

export default DentalChartPage;
