import { useState, useEffect } from "react";
import { useI18n } from "@/shared/i18n";
import { AppLayout } from "@/shared/components/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarSkeleton } from "@/shared/components/PageSkeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import type { Appointment } from "../types";
import { getAppointments } from "@/shared/api/crm";

const CalendarPage = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split("T")[0]);
  const [view, setView] = useState<"day" | "week">("day");
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    getAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const hours = Array.from({ length: 10 }, (_, i) => i + 8);
  const dayAppointments = appointments.filter((a) => a.date === currentDate);

  const getWeekDates = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(d);
      date.setDate(diff + i);
      return date.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates(currentDate);
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === "day" ? dir : dir * 7));
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  if (loading) {
    return (
      <AppLayout>
        <CalendarSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("calendar.title")}</h1>
          <Button className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("calendar.addAppointment")}</span>
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-heading font-semibold text-sm sm:text-base">{currentDate}</span>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant={view === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("day")}
                className={view === "day" ? "gradient-primary text-primary-foreground border-0" : ""}
              >
                {t("calendar.day")}
              </Button>
              <Button
                variant={view === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("week")}
                className={view === "week" ? "gradient-primary text-primary-foreground border-0" : ""}
              >
                {t("calendar.week")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {view === "day" ? (
              dayAppointments.length === 0 && hours.every(h => !appointments.some(a => a.date === currentDate && a.time.startsWith(String(h).padStart(2, "0")))) ? (
                <EmptyState icon={CalendarDays} title={t("calendar.noAppointments")} />
              ) : (
                <div className="space-y-1">
                  {hours.map((h) => {
                    const timeStr = `${String(h).padStart(2, "0")}:00`;
                    const appts = dayAppointments.filter((a) => a.time.startsWith(String(h).padStart(2, "0")));
                    return (
                      <div key={h} className="flex gap-2 sm:gap-4 min-h-[56px] group">
                        <div className="w-12 sm:w-16 text-xs sm:text-sm text-muted-foreground pt-2 text-right flex-shrink-0">
                          {timeStr}
                        </div>
                        <div className="flex-1 border-t border-border/50 pt-2 group-hover:bg-muted/30 rounded px-2 transition-colors">
                          {appts.map((a) => (
                            <div key={a.id} className="p-2 sm:p-2.5 mb-1 rounded-lg gradient-primary text-primary-foreground text-sm">
                              <p className="font-medium truncate">{a.patientName}</p>
                              <p className="text-xs opacity-80 truncate">{a.time} · {a.procedure} · {a.doctorName}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="grid grid-cols-8 gap-px min-w-[600px]">
                  <div className="w-12 sm:w-16" />
                  {weekDates.map((d, i) => (
                    <div key={d} className={`text-center p-1 sm:p-2 text-xs sm:text-sm font-medium ${d === currentDate ? "text-primary" : "text-muted-foreground"}`}>
                      <div>{dayNames[i]}</div>
                      <div className={`text-base sm:text-lg ${d === currentDate ? "bg-primary text-primary-foreground w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto" : ""}`}>
                        {new Date(d).getDate()}
                      </div>
                    </div>
                  ))}
                  {hours.map((h) => (
                    <div key={`row-${h}`} className="contents">
                      <div className="text-[10px] sm:text-xs text-muted-foreground text-right pr-1 sm:pr-2 pt-2 w-12 sm:w-16">
                        {`${String(h).padStart(2, "0")}:00`}
                      </div>
                      {weekDates.map((d) => {
                        const appts = appointments.filter(
                          (a) => a.date === d && a.time.startsWith(String(h).padStart(2, "0"))
                        );
                        return (
                          <div key={`${d}-${h}`} className="border-t border-border/30 min-h-[40px] sm:min-h-[48px] p-0.5">
                            {appts.map((a) => (
                              <div key={a.id} className="text-[10px] sm:text-xs p-1 sm:p-1.5 rounded gradient-primary text-primary-foreground mb-0.5 truncate">
                                {a.patientName.split(" ")[0]}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
