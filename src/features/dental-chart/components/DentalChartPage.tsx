import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DentalChartSkeleton } from "@/shared/components/PageSkeleton";
import { AppLayout } from "@/shared/components/AppLayout";
import { useI18n } from "@/shared/i18n";
import { Activity, CalendarClock, FileText, Search, Stethoscope, Wallet } from "lucide-react";
import {
  LOWER_TEETH,
  UPPER_TEETH,
  entryTypeLabels,
  fileCategoryLabels,
  formatDate,
  getChangedTeethCount,
  getPatientBalance,
  getPatientInvoiced,
  getPatientPaid,
  hasToothChanges,
  loadPatientCharts,
  saveToothRecord,
} from "../data";
import type { PatientChartRecord, ToothFormValues } from "../types";
import { Tooth } from "./Tooth";
import { ToothDetail } from "./ToothDetail";

const copy = {
  uk: {
    pageTitle: "Зубна карта пацієнта",
    pageSubtitle: "Карта зубів, медична історія та фінанси пацієнта в одному місці.",
    patientSearch: "Пошук пацієнта...",
    noPatient: "Пацієнтів не знайдено",
    upper: "Верхня щелепа",
    lower: "Нижня щелепа",
    chartTitle: "Пацієнтська зубна карта",
    chartNote: "Білий зуб означає відсутність записів. Рожевий означає, що по зубу є діагностика, лікування, файли або нотатки.",
    patientCard: "Медична картка",
    timeline: "Хронологія",
    files: "Файли",
    visits: "Візити",
    billing: "Фінанси",
    changedTeeth: "Змінені зуби",
    doctors: "Лікуючі лікарі",
    filesCount: "Файли",
    outstanding: "Борг",
    invoiced: "Виставлено",
    paid: "Оплачено",
    noTimeline: "У картці ще немає записів.",
    noFiles: "У картці ще немає файлів.",
    noVisits: "У картці ще немає візитів.",
    noInvoices: "У картці ще немає рахунків.",
    lastVisit: "Останній візит",
    notes: "Нотатки",
    saveSuccess: "Картку зуба оновлено",
    balance: "Баланс",
    toothChanges: "Зміни по зубах",
  },
  en: {
    pageTitle: "Patient Dental Chart",
    pageSubtitle: "Teeth map, medical history, and patient finances in one place.",
    patientSearch: "Search patient...",
    noPatient: "No patients found",
    upper: "Upper jaw",
    lower: "Lower jaw",
    chartTitle: "Patient chart",
    chartNote: "A white tooth has no records. A pink tooth has diagnosis, treatment, files, or notes attached to it.",
    patientCard: "Medical card",
    timeline: "Timeline",
    files: "Files",
    visits: "Visits",
    billing: "Billing",
    changedTeeth: "Changed teeth",
    doctors: "Doctors",
    filesCount: "Files",
    outstanding: "Outstanding",
    invoiced: "Invoiced",
    paid: "Paid",
    noTimeline: "No records in the chart yet.",
    noFiles: "No files in the chart yet.",
    noVisits: "No visits in the chart yet.",
    noInvoices: "No invoices in the chart yet.",
    lastVisit: "Last visit",
    notes: "Notes",
    saveSuccess: "Tooth chart updated",
    balance: "Balance",
    toothChanges: "Tooth changes",
  },
} as const;

const DentalChartPage = () => {
  const { lang } = useI18n();
  const text = copy[lang];
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [charts, setCharts] = useState<PatientChartRecord[]>([]);
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatientCharts()
        .then((data) => {
          setCharts(data);
          setLoading(false);
        })
        .catch(() => {
          setCharts([]);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const filteredCharts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return charts;

    return charts.filter((chart) => {
      const haystack = [chart.patient.fullName, chart.patient.phone, chart.patient.email]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [charts, search]);

  const selectedPatientId =
    searchParams.get("patient") ?? filteredCharts[0]?.patient.id ?? charts[0]?.patient.id ?? null;

  useEffect(() => {
    if (!selectedPatientId && charts[0]) {
      setSearchParams({ patient: charts[0].patient.id }, { replace: true });
      return;
    }

    if (selectedPatientId && !charts.some((chart) => chart.patient.id === selectedPatientId) && charts[0]) {
      setSearchParams({ patient: charts[0].patient.id }, { replace: true });
    }
  }, [charts, selectedPatientId, setSearchParams]);

  const patientChart = charts.find((chart) => chart.patient.id === selectedPatientId) ?? null;
  const selectedTooth =
    patientChart?.teeth.find((tooth) => tooth.toothNumber === selectedToothNumber) ??
    patientChart?.teeth.find((tooth) => hasToothChanges(tooth)) ??
    patientChart?.teeth[0] ??
    null;

  useEffect(() => {
    if (!patientChart) {
      setSelectedToothNumber(null);
      return;
    }

    if (!selectedToothNumber || !patientChart.teeth.some((tooth) => tooth.toothNumber === selectedToothNumber)) {
      setSelectedToothNumber(
        patientChart.teeth.find((tooth) => hasToothChanges(tooth))?.toothNumber ??
          patientChart.teeth[0]?.toothNumber ??
          null,
      );
    }
  }, [patientChart, selectedToothNumber]);

  const handleSelectPatient = (patientId: string) => {
    setSearchParams({ patient: patientId });
    navigate(`/dental-chart?patient=${patientId}`, { replace: true });
  };

  const handleSaveTooth = async (values: ToothFormValues) => {
    if (!patientChart || !selectedTooth) return;

    try {
      await saveToothRecord(
        patientChart.patient.id,
        values,
        selectedTooth.toothNumber,
        patientChart.attendingDoctors,
      );
      const refreshed = await loadPatientCharts();
      setCharts(refreshed);
      toast({ title: text.pageTitle, description: text.saveSuccess });
    } catch (error) {
      toast({
        title: text.pageTitle,
        description: error instanceof Error ? error.message : "Save failed",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <DentalChartSkeleton />
      </AppLayout>
    );
  }

  if (!patientChart) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl">
          <Card className="shadow-card">
            <CardContent className="py-16 text-center text-muted-foreground">{text.noPatient}</CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const changedTeeth = getChangedTeethCount(patientChart.teeth);
  const outstanding = getPatientBalance(patientChart.invoices);
  const invoiced = getPatientInvoiced(patientChart.invoices);
  const paid = getPatientPaid(patientChart.invoices);
  const timeline = patientChart.teeth
    .flatMap((tooth) =>
      tooth.entries.map((entry) => ({
        ...entry,
        doctorName: entry.doctorName || tooth.doctorName,
      })),
    )
    .sort((a, b) => `${b.visitDate}${b.createdAt}`.localeCompare(`${a.visitDate}${a.createdAt}`));

  const summaryCards = [
    { icon: Activity, label: text.changedTeeth, value: changedTeeth },
    { icon: FileText, label: text.filesCount, value: patientChart.files.length },
    { icon: Stethoscope, label: text.doctors, value: patientChart.attendingDoctors.length },
    { icon: Wallet, label: text.outstanding, value: `${outstanding} ₴` },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight">{text.pageTitle}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{text.pageSubtitle}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base">{text.pageTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={text.patientSearch}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[560px] pr-3">
                  <div className="space-y-2">
                    {filteredCharts.length > 0 ? (
                      filteredCharts.map((chart) => {
                        const isActive = chart.patient.id === patientChart.patient.id;
                        const issues = getChangedTeethCount(chart.teeth);

                        return (
                          <button
                            key={chart.patient.id}
                            type="button"
                            onClick={() => handleSelectPatient(chart.patient.id)}
                            className={`w-full rounded-2xl border p-4 text-left transition-all ${
                              isActive
                                ? "border-primary/40 bg-primary/5 shadow-sm"
                                : "border-border bg-card hover:border-primary/20 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="font-medium">{chart.patient.fullName}</p>
                                <p className="text-sm text-muted-foreground">{chart.patient.phone}</p>
                                <p className="text-xs text-muted-foreground">{chart.patient.email}</p>
                              </div>
                              <Badge variant={issues > 0 ? "destructive" : "secondary"}>{issues}</Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{text.lastVisit}</span>
                              <span>{chart.patient.lastVisit || "—"}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">{text.noPatient}</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base">{text.patientCard}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-lg font-semibold">{patientChart.patient.fullName}</p>
                  <p className="text-muted-foreground">{patientChart.patient.phone}</p>
                  <p className="text-muted-foreground">{patientChart.patient.email}</p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{text.notes}</p>
                  <p className="mt-2 leading-6">{patientChart.patient.notes || "—"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="rounded-2xl border bg-background p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                          <p className="mt-1 text-lg font-semibold">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden shadow-card">
              <CardHeader className="border-b bg-card/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="font-heading text-xl">{text.chartTitle}</CardTitle>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{text.chartNote}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {text.toothChanges}: {changedTeeth}
                    </Badge>
                    <Badge variant="outline">
                      {text.balance}: {outstanding} ₴
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-10 p-6">
                <div className="rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(244,236,232,0.9)_55%,_rgba(248,244,240,0.8))] p-4 md:p-6">
                  <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {text.upper}
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <div className="flex min-w-max gap-1">
                      {UPPER_TEETH.map((number) => {
                        const tooth = patientChart.teeth.find((item) => item.toothNumber === number);
                        if (!tooth) return null;

                        return (
                          <Tooth
                            key={number}
                            number={number}
                            isUpper
                            record={tooth}
                            selected={selectedTooth?.toothNumber === number}
                            onClick={() => setSelectedToothNumber(number)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.95),_rgba(244,236,232,0.9)_55%,_rgba(248,244,240,0.8))] p-4 md:p-6">
                  <div className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {text.lower}
                  </div>
                  <div className="flex justify-center overflow-x-auto">
                    <div className="flex min-w-max gap-1">
                      {LOWER_TEETH.map((number) => {
                        const tooth = patientChart.teeth.find((item) => item.toothNumber === number);
                        if (!tooth) return null;

                        return (
                          <Tooth
                            key={number}
                            number={number}
                            isUpper={false}
                            record={tooth}
                            selected={selectedTooth?.toothNumber === number}
                            onClick={() => setSelectedToothNumber(number)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_430px]">
              <Card className="shadow-card">
                <CardHeader className="border-b">
                  <CardTitle className="font-heading text-base">{text.patientCard}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="timeline">
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
                      <TabsTrigger value="timeline">{text.timeline}</TabsTrigger>
                      <TabsTrigger value="files">{text.files}</TabsTrigger>
                      <TabsTrigger value="visits">{text.visits}</TabsTrigger>
                      <TabsTrigger value="billing">{text.billing}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline">
                      <div className="space-y-3">
                        {timeline.length > 0 ? (
                          timeline.map((entry) => (
                            <div key={entry.id} className="rounded-2xl border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">#{entry.toothNumber}</Badge>
                                  <Badge variant="secondary">{entryTypeLabels[entry.type][lang]}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  {formatDate(entry.visitDate, lang)}
                                </div>
                              </div>
                              <p className="mt-3 font-medium">{entry.title}</p>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.description}</p>
                              <p className="mt-3 text-xs text-muted-foreground">{entry.doctorName}</p>
                            </div>
                          ))
                        ) : (
                          <p className="py-8 text-sm text-muted-foreground">{text.noTimeline}</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="files">
                      <div className="space-y-3">
                        {patientChart.files.length > 0 ? (
                          patientChart.files.map((file) => (
                            <div key={file.id} className="rounded-2xl border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-medium">{file.name}</p>
                                <Badge variant="secondary">{fileCategoryLabels[file.category][lang]}</Badge>
                              </div>
                              {typeof file.toothNumber === "number" ? (
                                <p className="mt-2 text-sm text-muted-foreground">#{file.toothNumber}</p>
                              ) : null}
                              {file.note ? <p className="mt-2 text-sm text-muted-foreground">{file.note}</p> : null}
                              <p className="mt-2 text-xs text-muted-foreground">{formatDate(file.addedAt, lang)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="py-8 text-sm text-muted-foreground">{text.noFiles}</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="visits">
                      <div className="space-y-3">
                        {patientChart.visits.length > 0 ? (
                          patientChart.visits.map((visit) => (
                            <div key={visit.id} className="rounded-2xl border p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="font-medium">{visit.procedure}</p>
                                <Badge variant={visit.status === "completed" ? "default" : "secondary"}>
                                  {visit.status}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{visit.doctorName}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatDate(visit.date, lang)} • {visit.time}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="py-8 text-sm text-muted-foreground">{text.noVisits}</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="billing">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text.invoiced}</p>
                          <p className="mt-2 text-2xl font-semibold">{invoiced} ₴</p>
                        </div>
                        <div className="rounded-2xl border p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text.paid}</p>
                          <p className="mt-2 text-2xl font-semibold">{paid} ₴</p>
                        </div>
                        <div className="rounded-2xl border p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text.outstanding}</p>
                          <p className="mt-2 text-2xl font-semibold">{outstanding} ₴</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {patientChart.invoices.length > 0 ? (
                          patientChart.invoices.map((invoice) => {
                            const invoiceTotal = invoice.procedures.reduce(
                              (sum, item) => sum + item.quantity * item.unitPrice,
                              0,
                            );
                            const invoicePaid = invoice.payments.reduce((sum, item) => sum + item.amount, 0);
                            const invoiceBalance = invoiceTotal - invoicePaid;

                            return (
                              <div key={invoice.id} className="rounded-2xl border p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="font-medium">{invoice.patientName}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.date, lang)}</p>
                                  </div>
                                  <Badge variant="secondary">{invoice.status}</Badge>
                                </div>
                                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                                  {invoice.procedures.map((procedure) => (
                                    <div key={procedure.id} className="flex items-center justify-between gap-3">
                                      <span>
                                        {procedure.name}
                                        {procedure.toothNumber ? ` • #${procedure.toothNumber}` : ""}
                                      </span>
                                      <span>{procedure.quantity * procedure.unitPrice} ₴</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span>{text.invoiced}: {invoiceTotal} ₴</span>
                                  <span>{text.paid}: {invoicePaid} ₴</span>
                                  <span>{text.outstanding}: {invoiceBalance} ₴</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="py-8 text-sm text-muted-foreground">{text.noInvoices}</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <ToothDetail tooth={selectedTooth} lang={lang} onSave={handleSaveTooth} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DentalChartPage;
