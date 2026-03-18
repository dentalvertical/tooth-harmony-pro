import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockInvoices } from "@/lib/mock-data";
import { Plus, DollarSign, Clock, AlertTriangle } from "lucide-react";

const statusVariant: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
};

const FinancesPage = () => {
  const { t } = useI18n();

  const totalPaid = mockInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalPending = mockInvoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = mockInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("finances.title")}</h1>
          <Button className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            {t("finances.createInvoice")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("finances.paid")}</p>
                <p className="text-xl font-heading font-bold">₴{totalPaid.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("finances.pending")}</p>
                <p className="text-xl font-heading font-bold">₴{totalPending.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("finances.overdue")}</p>
                <p className="text-xl font-heading font-bold">₴{totalOverdue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading text-base">{t("finances.invoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t("calendar.patient")}</TableHead>
                    <TableHead>{t("calendar.procedure")}</TableHead>
                    <TableHead>{t("finances.amount")}</TableHead>
                    <TableHead>{t("finances.date")}</TableHead>
                    <TableHead>{t("finances.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">INV-{inv.id.padStart(4, "0")}</TableCell>
                      <TableCell>{inv.patientName}</TableCell>
                      <TableCell>{inv.procedures}</TableCell>
                      <TableCell className="font-medium">₴{inv.amount.toLocaleString()}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusVariant[inv.status]}`}>
                          {t(`finances.${inv.status}`)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FinancesPage;
