import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockPatients } from "@/features/patients/data";
import { mockAppointments } from "@/features/appointments/data";
import {
  mockRevenueData, mockDoctorStats, mockProcedureStats, mockWeeklyAppointments,
} from "@/features/dashboard/data";
import { mockInvoices } from "@/features/finances/data";
import { getInvoicePaid } from "@/features/finances/types";
import { StatCard } from "./StatCard";
import { DashboardSkeleton } from "@/shared/components/PageSkeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { DollarSign, Users, CalendarDays, UserCheck, Calendar, TrendingUp, Award, Stethoscope } from "lucide-react";
import env from "@/config/env";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
];

function fmt(amount: number) {
  return `${env.defaultCurrency}${amount.toLocaleString("uk-UA")}`;
}

const DashboardPage = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const todayAppointments = mockAppointments.filter((a) => a.date === "2025-03-18");
  const totalPaid = mockInvoices.reduce((s, inv) => s + getInvoicePaid(inv), 0);
  const completedAppointments = mockAppointments.filter((a) => a.status === "completed").length;
  const totalAppointments = mockAppointments.length;

  if (loading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold">{t("dashboard.title")}</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title={t("dashboard.revenue")}
            value={fmt(totalPaid)}
            icon={DollarSign}
            color="gradient-primary text-primary-foreground"
          />
          <StatCard
            title={t("dashboard.patients")}
            value={String(mockPatients.length)}
            icon={Users}
            color="bg-info/10 text-info"
          />
          <StatCard
            title={t("dashboard.appointments")}
            value={String(todayAppointments.length)}
            icon={CalendarDays}
            color="bg-warning/10 text-warning"
          />
          <StatCard
            title={t("dashboard.doctors")}
            value={String(mockDoctorStats.length)}
            icon={UserCheck}
            color="bg-success/10 text-success"
          />
        </div>

        {/* Tabs: Overview / Doctors / Procedures */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("dashboard.overview")}</span>
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("dashboard.topDoctors")}</span>
            </TabsTrigger>
            <TabsTrigger value="procedures" className="gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("dashboard.procedureStats")}</span>
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Revenue Chart */}
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.revenueChart")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockRevenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          formatter={(value: number, name: string) =>
                            [name === "revenue" ? fmt(value) : value, name === "revenue" ? t("dashboard.revenue") : t("dashboard.appointmentCount")]
                          }
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.upcomingAppointments")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayAppointments.length > 0 ? (
                    todayAppointments.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{a.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.time} · {a.procedure}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={Calendar} title={t("calendar.noAppointments")} />
                  )}
                </CardContent>
              </Card>

              {/* Appointments by Month (Line) */}
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.appointmentTrend")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockRevenueData}>
                        <defs>
                          <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          formatter={(value: number) => [value, t("dashboard.appointmentCount")]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Area type="monotone" dataKey="appointments" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#colorAppointments)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Load */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.weeklyLoad")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockWeeklyAppointments}>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          formatter={(value: number) => [value, t("dashboard.appointmentCount")]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── DOCTORS TAB ── */}
          <TabsContent value="doctors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Cards */}
              {mockDoctorStats.map((doc, i) => (
                <Card key={doc.name} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold truncate">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.specialty}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-lg font-heading font-bold text-primary">{doc.appointments}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t("dashboard.appointmentCount")}</p>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-lg font-heading font-bold text-success">{doc.patients}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t("dashboard.patients")}</p>
                      </div>
                      <div className="text-center p-2.5 rounded-lg bg-muted/50">
                        <p className="text-lg font-heading font-bold text-info">{fmt(doc.revenue)}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t("dashboard.revenue")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Doctor Revenue Comparison */}
              <Card className="md:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.doctorComparison")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockDoctorStats} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? fmt(value) : value,
                            name === "revenue" ? t("dashboard.revenue") : t("dashboard.appointmentCount"),
                          ]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="revenue" />
                        <Bar dataKey="appointments" fill="hsl(var(--info))" radius={[0, 6, 6, 0]} name="appointments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Workload Pie */}
              <Card className="md:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.doctorWorkload")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockDoctorStats.map(d => ({ name: d.name, value: d.appointments }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          label={({ name, percent }) => `${name.replace('Др. ', '')} ${(percent * 100).toFixed(0)}%`}
                        >
                          {mockDoctorStats.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── PROCEDURES TAB ── */}
          <TabsContent value="procedures">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Procedures Bar Chart */}
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.procedureRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockProcedureStats} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "revenue" ? fmt(value) : value,
                            name === "revenue" ? t("dashboard.revenue") : t("dashboard.count"),
                          ]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} name="revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Procedures Pie */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.procedureDistribution")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mockProcedureStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          {mockProcedureStats.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top Procedures Table */}
              <Card className="lg:col-span-3 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("dashboard.procedureStats")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockProcedureStats.map((p, i) => {
                      const maxRevenue = Math.max(...mockProcedureStats.map((x) => x.revenue));
                      const pct = (p.revenue / maxRevenue) * 100;
                      return (
                        <div key={p.name} className="flex items-center gap-3 sm:gap-4">
                          <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{p.name}</span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{p.count}×</span>
                                <span className="text-sm font-heading font-semibold">{fmt(p.revenue)}</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
