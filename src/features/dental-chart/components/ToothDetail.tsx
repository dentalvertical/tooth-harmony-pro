import { useI18n } from "@/shared/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ToothData, ToothStatus } from "../types";

const statusBadge: Record<ToothStatus, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  cavity: "bg-destructive/10 text-destructive border-destructive/20",
  filled: "bg-warning/10 text-warning border-warning/20",
  missing: "bg-muted text-muted-foreground border-border",
  implant: "bg-info/10 text-info border-info/20",
};

const statuses: ToothStatus[] = ["healthy", "cavity", "filled", "missing", "implant"];

interface ToothDetailProps {
  tooth: ToothData | null;
  onChangeStatus: (id: number, status: ToothStatus) => void;
}

export function ToothDetail({ tooth, onChangeStatus }: ToothDetailProps) {
  const { t } = useI18n();

  const statusLabels: Record<ToothStatus, string> = {
    healthy: t("dental.healthy"),
    cavity: t("dental.cavity"),
    filled: t("dental.filled"),
    missing: t("dental.missing"),
    implant: t("dental.implant"),
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="font-heading text-base">
          {tooth ? `${t("dental.status")} — #${tooth.id}` : t("dental.selectTooth")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tooth ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t("dental.status")}</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <Button
                    key={s}
                    variant={tooth.status === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChangeStatus(tooth.id, s)}
                    className={tooth.status === s ? "gradient-primary text-primary-foreground border-0" : ""}
                  >
                    {statusLabels[s]}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t("dental.procedures")}</p>
              {tooth.procedures.length > 0 ? (
                <div className="space-y-2">
                  {tooth.procedures.map((p, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 text-sm">{p}</div>
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
  );
}
