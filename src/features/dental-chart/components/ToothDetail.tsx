import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  downloadMedicalFile,
  entryTypeLabels,
  fileCategoryLabels,
  formatDate,
  hasToothChanges,
} from "@/features/dental-chart/data";
import type { ToothFormValues, ToothRecord } from "../types";

interface ToothDetailProps {
  tooth: ToothRecord | null;
  lang: "uk" | "en";
  onSave: (values: ToothFormValues, file: File | null) => void;
}

const defaultValues: ToothFormValues = {
  title: "",
  type: "diagnosis",
  diagnosis: "",
  treatment: "",
  notes: "",
  doctorName: "",
  visitDate: "",
  fileName: "",
  fileCategory: "xray",
  fileNote: "",
};

const labels = {
  uk: {
    title: "Картка зуба",
    empty: "Оберіть зуб на схемі, щоб внести діагностику, лікування, файли та нотатки.",
    save: "Зберегти запис",
    titleField: "Заголовок запису",
    type: "Тип запису",
    diagnosis: "Діагноз",
    treatment: "Лікування / план",
    notes: "Примітки",
    doctor: "Лікуючий лікар",
    visitDate: "Дата запису",
    fileName: "Назва файлу",
    fileType: "Тип файлу",
    upload: "Файл",
    fileNote: "Коментар до файлу",
    latest: "Останнє оновлення",
    entries: "Історія по зубу",
    files: "Файли по зубу",
    unchanged: "Змін ще немає",
    changed: "Є зміни",
    download: "Завантажити",
    placeholderTitle: "Наприклад, пломбування 16 зуба",
    placeholderDiagnosis: "Стан зуба, діагноз, скарги",
    placeholderTreatment: "Виконане лікування або план",
    placeholderNotes: "Додаткові деталі, рекомендації, реакції",
    placeholderDoctor: "ПІБ лікаря",
    placeholderFile: "Рентген bitewing, інтраоральний скан...",
    placeholderFileNote: "Що містить файл",
  },
  en: {
    title: "Tooth Card",
    empty: "Select a tooth on the chart to add diagnosis, treatment, files, and notes.",
    save: "Save record",
    titleField: "Entry title",
    type: "Record type",
    diagnosis: "Diagnosis",
    treatment: "Treatment / plan",
    notes: "Notes",
    doctor: "Doctor",
    visitDate: "Record date",
    fileName: "File name",
    fileType: "File type",
    upload: "File",
    fileNote: "File note",
    latest: "Last update",
    entries: "Tooth history",
    files: "Tooth files",
    unchanged: "No changes yet",
    changed: "Has changes",
    download: "Download",
    placeholderTitle: "For example, filling on tooth 16",
    placeholderDiagnosis: "Condition, diagnosis, complaints",
    placeholderTreatment: "Completed treatment or plan",
    placeholderNotes: "Extra details, recommendations, reactions",
    placeholderDoctor: "Doctor name",
    placeholderFile: "Bitewing x-ray, intraoral scan...",
    placeholderFileNote: "What this file contains",
  },
} as const;

export function ToothDetail({ tooth, lang, onSave }: ToothDetailProps) {
  const [form, setForm] = useState<ToothFormValues>(defaultValues);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const text = labels[lang];

  useEffect(() => {
    if (!tooth) {
      setForm(defaultValues);
      setSelectedFile(null);
      return;
    }

    setForm({
      title: tooth.title,
      type: tooth.type,
      diagnosis: tooth.diagnosis,
      treatment: tooth.treatment,
      notes: tooth.notes,
      doctorName: tooth.doctorName,
      visitDate: tooth.visitDate,
      fileName: "",
      fileCategory: "xray",
      fileNote: "",
    });
    setSelectedFile(null);
  }, [tooth]);

  if (!tooth) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-heading text-base">{text.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{text.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-base">#{tooth.toothNumber}</CardTitle>
          <Badge variant={hasToothChanges(tooth) ? "destructive" : "secondary"}>
            {hasToothChanges(tooth) ? text.changed : text.unchanged}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[720px]">
          <div className="space-y-5 p-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="record-title">{text.titleField}</Label>
                <Input
                  id="record-title"
                  value={form.title}
                  placeholder={text.placeholderTitle}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{text.type}</Label>
                  <Select
                    value={form.type}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, type: value as ToothFormValues["type"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(entryTypeLabels).map(([value, copy]) => (
                        <SelectItem key={value} value={value}>
                          {copy[lang]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visit-date">{text.visitDate}</Label>
                  <Input
                    id="visit-date"
                    type="date"
                    value={form.visitDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, visitDate: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor-name">{text.doctor}</Label>
                <Input
                  id="doctor-name"
                  value={form.doctorName}
                  placeholder={text.placeholderDoctor}
                  onChange={(event) => setForm((prev) => ({ ...prev, doctorName: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">{text.diagnosis}</Label>
                <Textarea
                  id="diagnosis"
                  rows={3}
                  value={form.diagnosis}
                  placeholder={text.placeholderDiagnosis}
                  onChange={(event) => setForm((prev) => ({ ...prev, diagnosis: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">{text.treatment}</Label>
                <Textarea
                  id="treatment"
                  rows={3}
                  value={form.treatment}
                  placeholder={text.placeholderTreatment}
                  onChange={(event) => setForm((prev) => ({ ...prev, treatment: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{text.notes}</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={form.notes}
                  placeholder={text.placeholderNotes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>

              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-name">{text.fileName}</Label>
                    <Input
                      id="file-name"
                      value={form.fileName}
                      placeholder={text.placeholderFile}
                      onChange={(event) => setForm((prev) => ({ ...prev, fileName: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-file">{text.upload}</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setSelectedFile(file);
                        setForm((prev) => ({
                          ...prev,
                          fileName: file && !prev.fileName ? file.name : prev.fileName,
                        }));
                      }}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{text.fileType}</Label>
                      <Select
                        value={form.fileCategory}
                        onValueChange={(value) =>
                          setForm((prev) => ({ ...prev, fileCategory: value as ToothFormValues["fileCategory"] }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(fileCategoryLabels).map(([value, copy]) => (
                            <SelectItem key={value} value={value}>
                              {copy[lang]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file-note">{text.fileNote}</Label>
                      <Input
                        id="file-note"
                        value={form.fileNote}
                        placeholder={text.placeholderFileNote}
                        onChange={(event) => setForm((prev) => ({ ...prev, fileNote: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => onSave(form, selectedFile)}>{text.save}</Button>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4 text-sm">
              <p className="font-medium">{text.latest}</p>
              <p className="mt-1 text-muted-foreground">
                {tooth.updatedAt ? formatDate(tooth.updatedAt, lang) : "—"}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">{text.entries}</h3>
              {tooth.entries.length > 0 ? (
                tooth.entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{entryTypeLabels[entry.type][lang]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.visitDate, lang)}</span>
                    </div>
                    <p className="mt-3 font-medium">{entry.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{entry.doctorName}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{text.empty}</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium">{text.files}</h3>
              {tooth.files.length > 0 ? (
                tooth.files.map((file) => (
                  <div key={file.id} className="rounded-2xl border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{file.name}</p>
                      <Badge variant="secondary">{fileCategoryLabels[file.category][lang]}</Badge>
                    </div>
                    {file.note ? <p className="mt-2 text-sm text-muted-foreground">{file.note}</p> : null}
                    {file.doctorName ? <p className="mt-2 text-xs text-muted-foreground">{file.doctorName}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(file.addedAt, lang)}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => void downloadMedicalFile(file.id, file.name)}
                    >
                      {text.download}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{text.empty}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
