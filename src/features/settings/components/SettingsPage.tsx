import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StaffMember } from "@/features/settings/types";
import { Plus, User, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createUser, getUsers } from "@/shared/api/crm";

const roleBadge: Record<StaffMember["role"], string> = {
  superuser: "bg-destructive/10 text-destructive border-destructive/20",
  administrator: "bg-info/10 text-info border-info/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
};

const roleOptions: StaffMember["role"][] = ["superuser", "administrator", "doctor"];

const SettingsPage = () => {
  const { t, lang, setLang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor" as StaffMember["role"],
  });

  useEffect(() => {
    getUsers()
      .then(setStaff)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    toast({ title: t("common.success"), description: t("settings.saved") });
  };

  const resetCreateForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "doctor",
    });
  };

  const handleCreateUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast({
        title: t("common.error"),
        description: lang === "uk" ? "Заповніть ім'я, email і пароль." : "Fill in name, email, and password.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await createUser(form);
      setStaff((prev) => [...prev, createdUser].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreateForm(false);
      resetCreateForm();
      toast({
        title: t("common.success"),
        description: lang === "uk" ? "Користувача створено." : "User created.",
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold">{t("settings.title")}</h1>

        <Tabs defaultValue="clinic">
          <TabsList>
            <TabsTrigger value="clinic" className="gap-2">
              <Building2 className="w-4 h-4" />
              {t("settings.clinic")}
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <User className="w-4 h-4" />
              {t("settings.staff")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clinic" className="mt-6">
            <Card className="shadow-card">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("settings.clinicName")}</Label>
                    <Input defaultValue="DentaCare Clinic" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.phone")}</Label>
                    <Input defaultValue="+380441234567" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("settings.address")}</Label>
                    <Input defaultValue="РІСѓР». РҐСЂРµС‰Р°С‚РёРє 1, РљРёС—РІ, 01001" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.language")}</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={lang === "uk" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLang("uk")}
                        className={lang === "uk" ? "gradient-primary text-primary-foreground border-0" : ""}
                      >
                        Українська
                      </Button>
                      <Button
                        variant={lang === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLang("en")}
                        className={lang === "en" ? "gradient-primary text-primary-foreground border-0" : ""}
                      >
                        English
                      </Button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} className="gradient-primary text-primary-foreground border-0">
                  {t("settings.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                className="gradient-primary text-primary-foreground border-0 gap-2"
                onClick={() => {
                  setShowCreateForm((prev) => !prev);
                  resetCreateForm();
                }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("settings.addStaff")}</span>
              </Button>
            </div>

            {showCreateForm ? (
              <Card className="shadow-card">
                <CardContent className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{lang === "uk" ? "Ім'я" : "Name"}</Label>
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder={lang === "uk" ? "Повне ім'я" : "Full name"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("login.email")}</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="doctor@clinic.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("login.password")}</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.role")}</Label>
                    <Select
                      value={form.role}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, role: value as StaffMember["role"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`settings.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <Button onClick={() => void handleCreateUser()} disabled={submitting}>
                      {submitting ? (lang === "uk" ? "Створення..." : "Creating...") : t("settings.addStaff")}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={submitting}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((s) => (
                <Card key={s.id} className="shadow-card">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${roleBadge[s.role]}`}>
                      {t(`settings.${s.role}`)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
