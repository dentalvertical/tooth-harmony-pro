import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockInvoices } from "@/features/finances/data";
import type { Invoice, MonthlyReport } from "@/features/finances/types";
import { getInvoiceTotal, getInvoicePaid, getInvoiceBalance } from "@/features/finances/types";
import { FinancesSkeleton } from "@/shared/components/PageSkeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { Plus, DollarSign, Clock, AlertTriangle, TrendingUp, CreditCard, Receipt } from "lucide-react";
import env from "@/config/env";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const statusVariant: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  partial: "bg-info/10 text-info border-info/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const methodLabel: Record<string, string> = {
  cash: "Готівка",
  card: "Картка",
  bank_transfer: "Переказ",
};

const PIE_COLORS = [
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
];

function fmt(amount: number, currency: string) {
  return `${currency}${amount.toLocaleString("uk-UA")}`;
}

function buildMonthlyReport(invoices: Invoice[]): MonthlyReport[] {
  const map = new Map<string, MonthlyReport>();
  for (const inv of invoices) {
    const m = inv.date.slice(0, 7);
    const label = new Date(inv.date).toLocaleDateString("uk-UA", { month: "short", year: "2-digit" });
    const existing = map.get(m) ?? { month: label, revenue: 0, invoiced: 0, outstanding: 0, count: 0 };
    existing.invoiced += getInvoiceTotal(inv);
    existing.revenue += getInvoicePaid(inv);
    existing.outstanding += getInvoiceBalance(inv);
    existing.count += 1;
    map.set(m, existing);
  }
  return Array.from(map.values());
}

const FinancesPage = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const cur = env.defaultCurrency;
  const totalPaid = mockInvoices.reduce((s, i) => s + getInvoicePaid(i), 0);
  const totalPending = mockInvoices
    .filter((i) => i.status === "pending" || i.status === "partial")
    .reduce((s, i) => s + getInvoiceBalance(i), 0);
  const totalOverdue = mockInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + getInvoiceBalance(i), 0);
  const totalInvoiced = mockInvoices.reduce((s, i) => s + getInvoiceTotal(i), 0);

  const report = buildMonthlyReport(mockInvoices);

  const statusCounts = [
    { name: t("finances.paid"), value: mockInvoices.filter((i) => i.status === "paid").length },
    { name: t("finances.pending"), value: mockInvoices.filter((i) => i.status === "pending").length },
    { name: t("finances.partial"), value: mockInvoices.filter((i) => i.status === "partial").length },
    { name: t("finances.overdue"), value: mockInvoices.filter((i) => i.status === "overdue").length },
  ].filter((s) => s.value > 0);

  if (loading) {
    return (
      <AppLayout>
        <FinancesSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("finances.title")}</h1>
          <Button className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("finances.createInvoice")}</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-card">
            <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("finances.totalInvoiced")}</p>
                <p className="text-base sm:text-xl font-heading font-bold truncate">{fmt(totalInvoiced, cur)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("finances.paid")}</p>
                <p className="text-base sm:text-xl font-heading font-bold truncate">{fmt(totalPaid, cur)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("finances.pending")}</p>
                <p className="text-base sm:text-xl font-heading font-bold truncate">{fmt(totalPending, cur)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("finances.overdue")}</p>
                <p className="text-base sm:text-xl font-heading font-bold truncate">{fmt(totalOverdue, cur)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">{t("finances.invoices")}</TabsTrigger>
            <TabsTrigger value="reports">{t("finances.reports")}</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card className="shadow-card">
              <CardContent className="pt-6">
                {mockInvoices.length === 0 ? (
                  <EmptyState icon={Receipt} title={t("common.noData")} />
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>{t("calendar.patient")}</TableHead>
                          <TableHead className="hidden md:table-cell">{t("finances.procedures")}</TableHead>
                          <TableHead className="text-right">{t("finances.totalInvoiced")}</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">{t("finances.paidAmount")}</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">{t("finances.balance")}</TableHead>
                          <TableHead className="hidden lg:table-cell">{t("finances.date")}</TableHead>
                          <TableHead>{t("finances.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockInvoices.map((inv) => {
                          const total = getInvoiceTotal(inv);
                          const paid = getInvoicePaid(inv);
                          const balance = getInvoiceBalance(inv);
                          const isExpanded = expandedId === inv.id;

                          return (
                            <div key={inv.id} className="contents">
                              <TableRow
                                className="cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                              >
                                <TableCell className="font-medium">INV-{inv.id.padStart(4, "0")}</TableCell>
                                <TableCell className="max-w-[120px] truncate">{inv.patientName}</TableCell>
                                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                                  {inv.procedures.map((p) => p.name).join(", ")}
                                </TableCell>
                                <TableCell className="text-right font-medium">{fmt(total, inv.currency)}</TableCell>
                                <TableCell className="text-right text-success font-medium hidden sm:table-cell">{fmt(paid, inv.currency)}</TableCell>
                                <TableCell className="text-right font-medium hidden sm:table-cell">
                                  {balance > 0 ? (
                                    <span className="text-destructive">{fmt(balance, inv.currency)}</span>
                                  ) : (
                                    <span className="text-success">0</span>
                                  )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">{inv.date}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${statusVariant[inv.status]}`}>
                                    {t(`finances.${inv.status}`)}
                                  </span>
                                </TableCell>
                              </TableRow>

                              {isExpanded && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={8} className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="text-sm font-semibold mb-2">{t("finances.procedures")}</h4>
                                        <div className="space-y-1.5">
                                          {inv.procedures.map((p) => (
                                            <div key={p.id} className="flex justify-between text-sm">
                                              <span>
                                                {p.name}
                                                {p.toothNumber && (
                                                  <span className="text-muted-foreground ml-1">(#{p.toothNumber})</span>
                                                )}
                                                {p.quantity > 1 && (
                                                  <span className="text-muted-foreground ml-1">×{p.quantity}</span>
                                                )}
                                              </span>
                                              <span className="font-medium">{fmt(p.quantity * p.unitPrice, inv.currency)}</span>
                                            </div>
                                          ))}
                                          <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5">
                                            <span>{t("finances.total")}</span>
                                            <span>{fmt(total, inv.currency)}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                                          <CreditCard className="w-4 h-4" />
                                          {t("finances.payments")}
                                        </h4>
                                        {inv.payments.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">{t("finances.noPayments")}</p>
                                        ) : (
                                          <div className="space-y-1.5">
                                            {inv.payments.map((pay) => (
                                              <div key={pay.id} className="flex justify-between text-sm">
                                                <span>
                                                  {pay.date}
                                                  <span className="text-muted-foreground ml-1.5">
                                                    ({methodLabel[pay.method] ?? pay.method})
                                                  </span>
                                                </span>
                                                <span className="font-medium text-success">{fmt(pay.amount, inv.currency)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {balance > 0 && (
                                          <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                                            <Plus className="w-3.5 h-3.5" />
                                            {t("finances.addPayment")}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </div>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("finances.monthlyRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          formatter={(value: number) => fmt(value, cur)}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar dataKey="revenue" name={t("finances.paid")} fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="outstanding" name={t("finances.outstanding")} fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("finances.byStatus")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                          {statusCounts.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-base">{t("finances.summaryTable")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("finances.period")}</TableHead>
                          <TableHead className="text-right">{t("finances.invoiceCount")}</TableHead>
                          <TableHead className="text-right">{t("finances.totalInvoiced")}</TableHead>
                          <TableHead className="text-right">{t("finances.paid")}</TableHead>
                          <TableHead className="text-right">{t("finances.outstanding")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.map((r) => (
                          <TableRow key={r.month}>
                            <TableCell className="font-medium">{r.month}</TableCell>
                            <TableCell className="text-right">{r.count}</TableCell>
                            <TableCell className="text-right">{fmt(r.invoiced, cur)}</TableCell>
                            <TableCell className="text-right text-success">{fmt(r.revenue, cur)}</TableCell>
                            <TableCell className="text-right text-warning">{fmt(r.outstanding, cur)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

export default FinancesPage;
