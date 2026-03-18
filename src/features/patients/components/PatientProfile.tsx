import { useI18n } from "@/shared/i18n";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Patient } from "../types";
import type { Appointment } from "@/features/appointments/types";

interface PatientProfileProps {
  patient: Patient | null;
  onClose: () => void;
  history: Appointment[];
}

export function PatientProfile({ patient, onClose, history }: PatientProfileProps) {
  const { t } = useI18n();

  return (
    <Dialog open={!!patient} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("patients.profile")}</DialogTitle>
        </DialogHeader>
        {patient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("patients.name")}</p>
                <p className="font-medium">{patient.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("patients.phone")}</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("patients.email")}</p>
                <p className="font-medium">{patient.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("patients.lastVisit")}</p>
                <p className="font-medium">{patient.lastVisit}</p>
              </div>
            </div>
            {patient.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{t("patients.notes")}</p>
                <p className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">{patient.notes}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t("patients.history")}</p>
              {history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{h.procedure}</p>
                        <p className="text-xs text-muted-foreground">{h.date} · {h.time}</p>
                      </div>
                      <Badge variant={h.status === "completed" ? "default" : "secondary"}>
                        {h.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
