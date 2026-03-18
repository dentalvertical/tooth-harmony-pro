import { useState } from "react";
import { useI18n } from "@/shared/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatientFormData {
  fullName: string;
  phone: string;
  email: string;
  notes: string;
}

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PatientFormData) => void;
}

export function PatientForm({ open, onOpenChange, onSubmit }: PatientFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<PatientFormData>({
    fullName: "",
    phone: "",
    email: "",
    notes: "",
  });

  const handleSubmit = () => {
    onSubmit(form);
    setForm({ fullName: "", phone: "", email: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{t("patients.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("patients.name")}</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("patients.phone")}</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("patients.email")}</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t("patients.notes")}</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground border-0">
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
