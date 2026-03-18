import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockStaff, type StaffMember } from "@/lib/mock-data";
import { Plus, User, Building2 } from "lucide-react";

const roleBadge: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  doctor: "bg-primary/10 text-primary border-primary/20",
  assistant: "bg-info/10 text-info border-info/20",
};

const SettingsPage = () => {
  const { t, lang, setLang } = useI18n();
  const [staff] = useState<StaffMember[]>(mockStaff);

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
              <CardContent className="p-6 space-y-4">
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
                <Button className="gradient-primary text-primary-foreground border-0">
                  {t("settings.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button className="gradient-primary text-primary-foreground border-0 gap-2">
                <Plus className="w-4 h-4" />
                {t("settings.addStaff")}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((s) => (
                <Card key={s.id} className="shadow-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge[s.role]}`}>
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
