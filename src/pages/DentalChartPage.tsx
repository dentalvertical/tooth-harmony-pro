import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateDentalChart, type ToothData, type ToothStatus } from "@/lib/mock-data";

const statusColors: Record<ToothStatus, string> = {
  healthy: "fill-tooth-healthy",
  cavity: "fill-tooth-cavity",
  filled: "fill-tooth-filled",
  missing: "fill-tooth-missing",
  implant: "fill-tooth-implant",
};

const statusBadge: Record<ToothStatus, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  cavity: "bg-destructive/10 text-destructive border-destructive/20",
  filled: "bg-warning/10 text-warning border-warning/20",
  missing: "bg-muted text-muted-foreground border-border",
  implant: "bg-info/10 text-info border-info/20",
};

const Tooth = ({
  data,
  x,
  y,
  selected,
  onClick,
}: {
  data: ToothData;
  x: number;
  y: number;
  selected: boolean;
  onClick: () => void;
}) => (
  <g onClick={onClick} className="cursor-pointer" role="button" tabIndex={0}>
    <rect
      x={x}
      y={y}
      width={36}
      height={44}
      rx={6}
      className={`${statusColors[data.status]} ${
        selected ? "stroke-primary stroke-[3]" : "stroke-border stroke-[1.5]"
      } transition-all hover:opacity-80`}
    />
    <text
      x={x + 18}
      y={y + 27}
      textAnchor="middle"
      className="fill-foreground text-xs font-medium pointer-events-none"
      style={{ fontSize: "11px" }}
    >
      {data.id}
    </text>
  </g>
);

const DentalChartPage = () => {
  const { t } = useI18n();
  const [teeth, setTeeth] = useState<ToothData[]>(() => generateDentalChart());
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);

  const upperTeeth = teeth.filter((t) => t.id >= 1 && t.id <= 16);
  const lowerTeeth = teeth.filter((t) => t.id >= 17 && t.id <= 32);

  const setToothStatus = (id: number, status: ToothStatus) => {
    setTeeth((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    if (selectedTooth?.id === id) {
      setSelectedTooth((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const statuses: ToothStatus[] = ["healthy", "cavity", "filled", "missing", "implant"];
  const statusLabels: Record<ToothStatus, string> = {
    healthy: t("dental.healthy"),
    cavity: t("dental.cavity"),
    filled: t("dental.filled"),
    missing: t("dental.missing"),
    implant: t("dental.implant"),
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold">{t("dental.title")}</h1>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {statuses.map((s) => (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusBadge[s]}`}>
              <div className={`w-3 h-3 rounded-sm bg-tooth-${s}`} style={{ backgroundColor: `hsl(var(--tooth-${s}))` }} />
              {statusLabels[s]}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">{t("dental.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <svg width="640" height="260" viewBox="0 0 640 260" className="w-full max-w-[640px]">
                {/* Upper jaw label */}
                <text x="320" y="20" textAnchor="middle" className="fill-muted-foreground text-xs" style={{ fontSize: "11px" }}>
                  {t("dental.upper")}
                </text>

                {/* Upper teeth: 1-16 */}
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

                {/* Midline */}
                <line x1={10 + 8 * 39 - 1} y1={25} x2={10 + 8 * 39 - 1} y2={80} className="stroke-border stroke-[1]" strokeDasharray="4 2" />

                {/* Lower jaw label */}
                <text x="320" y="115" textAnchor="middle" className="fill-muted-foreground text-xs" style={{ fontSize: "11px" }}>
                  {t("dental.lower")}
                </text>

                {/* Lower teeth: 17-32 */}
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

          {/* Tooth detail panel */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {selectedTooth
                  ? `${t("dental.status")} — #${selectedTooth.id}`
                  : t("dental.selectTooth")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTooth ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("dental.status")}</p>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((s) => (
                        <Button
                          key={s}
                          variant={selectedTooth.status === s ? "default" : "outline"}
                          size="sm"
                          onClick={() => setToothStatus(selectedTooth.id, s)}
                          className={selectedTooth.status === s ? "gradient-primary text-primary-foreground border-0" : ""}
                        >
                          {statusLabels[s]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t("dental.procedures")}</p>
                    {selectedTooth.procedures.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTooth.procedures.map((p, i) => (
                          <div key={i} className="p-2 rounded bg-muted/50 text-sm">
                            {p}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("dental.selectTooth")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DentalChartPage;
