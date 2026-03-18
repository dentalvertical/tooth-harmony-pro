import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mockPatients, mockAppointments, type Patient } from "@/lib/mock-data";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phone: "",
    email: "",
    notes: "",
  });

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const patient: Patient = {
      id: String(Date.now()),
      ...newPatient,
      lastVisit: "-",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPatients([patient, ...patients]);
    setShowAdd(false);
    setNewPatient({ fullName: "", phone: "", email: "", notes: "" });
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("patients.name")}</TableHead>
                    <TableHead>{t("patients.phone")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("patients.email")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("patients.lastVisit")}</TableHead>
                    <TableHead className="text-right">{t("patients.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{p.fullName}</TableCell>
                      <TableCell>{p.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.lastVisit}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setShowProfile(p)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/dental-chart?patient=${p.id}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Patient Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{t("patients.add")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("patients.name")}</Label>
                <Input value={newPatient.fullName} onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("patients.phone")}</Label>
                <Input value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("patients.email")}</Label>
                <Input value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("patients.notes")}</Label>
                <Textarea value={newPatient.notes} onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })} />
              </div>
              <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground border-0">
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Patient Profile Dialog */}
        <Dialog open={!!showProfile} onOpenChange={() => setShowProfile(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">{t("patients.profile")}</DialogTitle>
            </DialogHeader>
            {showProfile && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("patients.name")}</p>
                    <p className="font-medium">{showProfile.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("patients.phone")}</p>
                    <p className="font-medium">{showProfile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("patients.email")}</p>
                    <p className="font-medium">{showProfile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("patients.lastVisit")}</p>
                    <p className="font-medium">{showProfile.lastVisit}</p>
                  </div>
                </div>
                {showProfile.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("patients.notes")}</p>
                    <p className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">{showProfile.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("patients.history")}</p>
                  {patientHistory.length > 0 ? (
                    <div className="space-y-2">
                      {patientHistory.map((h) => (
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
      </div>
    </AppLayout>
  );
};

export default PatientsPage;
