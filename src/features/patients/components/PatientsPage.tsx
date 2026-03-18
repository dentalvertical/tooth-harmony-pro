import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockPatients } from "@/features/patients/data";
import { mockAppointments } from "@/features/appointments/data";
import { PatientTable } from "./PatientTable";
import { PatientForm } from "./PatientForm";
import { PatientProfile } from "./PatientProfile";
import type { Patient } from "../types";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<Patient | null>(null);

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (data: { fullName: string; phone: string; email: string; notes: string }) => {
    const patient: Patient = {
      id: String(Date.now()),
      ...data,
      lastVisit: "-",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPatients([patient, ...patients]);
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setPatients(patients.filter((p) => p.id !== id));
  };

  const patientHistory = showProfile
    ? mockAppointments.filter((a) => a.patientId === showProfile.id)
    : [];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("patients.title")}</h1>
          <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            {t("patients.add")}
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
            <PatientTable
              patients={filtered}
              onView={(p) => setShowProfile(p)}
              onEdit={(p) => navigate(`/dental-chart?patient=${p.id}`)}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        <PatientForm open={showAdd} onOpenChange={setShowAdd} onSubmit={handleAdd} />
        <PatientProfile patient={showProfile} onClose={() => setShowProfile(null)} history={patientHistory} />
      </div>
    </AppLayout>
  );
};

export default PatientsPage;
