import { useEffect, useMemo, useState } from "react";
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
import { Building2, Pencil, Plus, ShieldX, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createUser, deactivateUser, getUsers, updateUser } from "@/shared/api/crm";
import { useAuth } from "@/features/auth/store";

const roleBadge: Record<StaffMember["role"], string> = {
  superuser: "bg-destructive/10 text-destructive border-destructive/20",
  administrator: "bg-info/10 text-info border-info/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
};

type StaffFormState = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: StaffMember["role"];
};

const defaultForm: StaffFormState = {
  name: "",
  email: "",
  password: "",
  role: "doctor",
};

const SettingsPage = () => {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const isSuperuser = user?.role === "superuser";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<StaffFormState>(defaultForm);

  useEffect(() => {
    getUsers()
      .then(setStaff)
      .finally(() => setLoading(false));
  }, []);

  const availableRoles = useMemo(
    () => (isSuperuser ? ["superuser", "administrator", "doctor"] : ["administrator", "doctor"]) as StaffMember["role"][],
    [isSuperuser],
  );

  const handleSave = () => {
    toast({ title: t("common.success"), description: t("settings.saved") });
  };

  const resetForm = () => {
    setForm({
      ...defaultForm,
      role: isSuperuser ? "doctor" : "administrator",
    });
  };

  const openCreateForm = () => {
    setFormMode("create");
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (member: StaffMember) => {
    setFormMode("edit");
    setForm({
      id: member.id,
      name: member.name,
      email: member.email,
      password: "",
      role: member.role === "superuser" && !isSuperuser ? "administrator" : member.role,
    });
    setShowForm(true);
  };

  const upsertMember = (member: StaffMember) => {
    setStaff((prev) => {
      const next = prev.some((item) => item.id === member.id)
        ? prev.map((item) => (item.id === member.id ? member : item))
        : [...prev, member];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || (formMode === "create" && !form.password.trim())) {
      toast({
        title: t("common.error"),
        description: lang === "uk" ? "Заповніть ім'я, email і пароль." : "Fill in name, email, and password.",
        variant: "destructive",
      });
      return false;
    }

    if (!isSuperuser && form.role === "superuser") {
      toast({
        title: t("common.error"),
        description: lang === "uk" ? "Недостатньо прав для ролі суперюзера." : "Not enough permissions for superuser role.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const saved =
        formMode === "create"
          ? await createUser({
              name: form.name,
              email: form.email,
              password: form.password,
              role: form.role,
            })
          : await updateUser({
              id: form.id!,
              name: form.name,
              password: form.password || undefined,
              role: form.role,
            });

      upsertMember(saved);
      setShowForm(false);
      resetForm();
      toast({
        title: t("common.success"),
        description: formMode === "create"
          ? lang === "uk" ? "Користувача створено." : "User created."
          : lang === "uk" ? "Користувача оновлено." : "User updated.",
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

  const handleDeactivate = async (member: StaffMember) => {
    if (!isSuperuser) return;

    setSubmitting(true);
    try {
      await deactivateUser(member.id);
      setStaff((prev) => prev.filter((item) => item.id !== member.id));
      toast({
        title: t("common.success"),
        description: lang === "uk" ? "Користувача деактивовано." : "User deactivated.",
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
                    <Input defaultValue="вул. Хрещатик 1, Київ, 01001" />
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
            {isSuperuser ? (
              <div className="flex justify-end">
                <Button className="gradient-primary text-primary-foreground border-0 gap-2" onClick={openCreateForm}>
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("settings.addStaff")}</span>
                </Button>
              </div>
            ) : null}

            {showForm && isSuperuser ? (
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
                      disabled={formMode === "edit"}
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
                      placeholder={formMode === "edit" ? (lang === "uk" ? "Новий пароль" : "New password") : "••••••••"}
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
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`settings.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <Button onClick={() => void handleSubmitForm()} disabled={submitting}>
                      {submitting
                        ? lang === "uk" ? "Збереження..." : "Saving..."
                        : formMode === "create"
                          ? t("settings.addStaff")
                          : lang === "uk" ? "Оновити" : "Update"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!isSuperuser ? (
              <Card className="shadow-card border-info/30">
                <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <ShieldX className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {lang === "uk"
                      ? "Створення, редагування і деактивація користувачів доступні тільки суперюзеру."
                      : "Creating, editing, and deactivating users is available to superusers only."}
                  </span>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((member) => (
                <Card key={member.id} className="shadow-card">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${roleBadge[member.role]}`}>
                        {t(`settings.${member.role}`)}
                      </span>
                    </div>

                    {isSuperuser ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditForm(member)}>
                          <Pencil className="h-3.5 w-3.5" />
                          {lang === "uk" ? "Редагувати" : "Edit"}
                        </Button>
                        {member.id !== user?.id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => void handleDeactivate(member)}
                          >
                            <ShieldX className="h-3.5 w-3.5" />
                            {lang === "uk" ? "Деактивувати" : "Deactivate"}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
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
