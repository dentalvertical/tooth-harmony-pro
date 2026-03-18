import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPatients, mockAppointments, mockRevenueData } from "@/lib/mock-data";
import { DollarSign, Users, CalendarDays, UserCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) => (
  <Card className="shadow-card hover:shadow-elevated transition-shadow">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { t } = useI18n();
  const todayAppointments = mockAppointments.filter(
    (a) => a.date === "2025-03-18"
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-heading font-bold">{t("dashboard.title")}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("dashboard.revenue")}
            value="₴67,000"
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
            value="2"
            icon={UserCheck}
            color="bg-success/10 text-success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {t("dashboard.revenueChart")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">
                {t("dashboard.upcomingAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.time} · {a.procedure}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
