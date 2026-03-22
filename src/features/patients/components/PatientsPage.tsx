import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientTable } from "./PatientTable";
import { PatientForm } from "./PatientForm";
import { PatientProfile } from "./PatientProfile";
import { PatientsSkeleton } from "@/shared/components/PageSkeleton";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { EmptyState } from "@/shared/components/EmptyState";
import type { Patient } from "../types";
import { Plus, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { createPatient, deletePatient as removePatient, getAppointments, getPatients } from "@/shared/api/crm";
import type { Appointment } from "@/features/appointments/types";
import { useAuth } from "@/features/auth/store";

const PatientsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPatients(), getAppointments()])
      .then(([patientList, appointmentList]) => {
        setPatients(patientList);
        setAppointments(appointmentList);
      })
      .catch((error) => {
        toast({
          title: t("common.error"),
          description: error instanceof Error ? error.message : t("common.errorMessage"),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (data: { fullName: string; phone: string; email: string; notes: string }) => {
    try {
      const patient = await createPatient(data);
      setPatients((prev) => [patient, ...prev]);
      setShowAdd(false);
      toast({ title: t("common.success"), description: t("patients.added") });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.errorMessage"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removePatient(deleteTarget);
      setPatients((prev) => prev.filter((p) => p.id !== deleteTarget));
      setDeleteTarget(null);
      toast({ title: t("common.success"), description: t("patients.deleted") });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.errorMessage"),
        variant: "destructive",
      });
    }
  };

  const patientHistory = showProfile
    ? appointments.filter((a) => a.patientId === showProfile.id)
    : [];

  if (loading) {
    return (
      <AppLayout>
        <PatientsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("patients.title")}</h1>
          <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("patients.add")}</span>
          </Button>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("patients.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {filtered.length > 0 ? (
              <PatientTable
                patients={filtered}
                onView={(p) => setShowProfile(p)}
                onEdit={(p) => navigate(`/dental-chart?patient=${p.id}`)}
                onDelete={(id) => setDeleteTarget(id)}
                canDelete={user?.role === "superuser"}
              />
            ) : (
              <EmptyState icon={Users} title={t("common.noData")} />
            )}
          </CardContent>
        </Card>

        <PatientForm open={showAdd} onOpenChange={setShowAdd} onSubmit={handleAdd} />
        <PatientProfile patient={showProfile} onClose={() => setShowProfile(null)} history={patientHistory} />
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={t("patients.deleteConfirmTitle")}
          description={t("patients.deleteConfirmDesc")}
          confirmLabel={t("common.delete")}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </AppLayout>
  );
};

export default PatientsPage;
