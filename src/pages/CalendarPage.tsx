import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockAppointments } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

const CalendarPage = () => {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState("2025-03-18");
  const [view, setView] = useState<"day" | "week">("day");

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8:00 - 17:00

  const dayAppointments = mockAppointments.filter((a) => a.date === currentDate);

  // Week view: generate 7 days
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-heading font-bold">{t("calendar.title")}</h1>
          <Button className="gradient-primary text-primary-foreground border-0 gap-2">
            <Plus className="w-4 h-4" />
            {t("calendar.addAppointment")}
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-heading font-semibold">{currentDate}</span>
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
              <div className="space-y-1">
                {hours.map((h) => {
                  const timeStr = `${String(h).padStart(2, "0")}:00`;
                  const appts = dayAppointments.filter((a) => a.time.startsWith(String(h).padStart(2, "0")));

                  return (
                    <div key={h} className="flex gap-4 min-h-[56px] group">
                      <div className="w-16 text-sm text-muted-foreground pt-2 text-right flex-shrink-0">
                        {timeStr}
                      </div>
                      <div className="flex-1 border-t border-border/50 pt-2 group-hover:bg-muted/30 rounded px-2 transition-colors">
                        {appts.map((a) => (
                          <div
                            key={a.id}
                            className="p-2.5 mb-1 rounded-lg gradient-primary text-primary-foreground text-sm"
                          >
                            <p className="font-medium">{a.patientName}</p>
                            <p className="text-xs opacity-80">
                              {a.time} · {a.procedure} · {a.doctorName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-px min-w-[700px]">
                  <div className="w-16" />
                  {weekDates.map((d, i) => (
                    <div key={d} className={`text-center p-2 text-sm font-medium ${d === currentDate ? "text-primary" : "text-muted-foreground"}`}>
                      <div>{dayNames[i]}</div>
                      <div className={`text-lg ${d === currentDate ? "bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto" : ""}`}>
                        {new Date(d).getDate()}
                      </div>
                    </div>
                  ))}

                  {hours.map((h) => (
                    <>
                      <div key={`label-${h}`} className="text-xs text-muted-foreground text-right pr-2 pt-2 w-16">
                        {`${String(h).padStart(2, "0")}:00`}
                      </div>
                      {weekDates.map((d) => {
                        const appts = mockAppointments.filter(
                          (a) => a.date === d && a.time.startsWith(String(h).padStart(2, "0"))
                        );
                        return (
                          <div key={`${d}-${h}`} className="border-t border-border/30 min-h-[48px] p-0.5">
                            {appts.map((a) => (
                              <div key={a.id} className="text-xs p-1.5 rounded gradient-primary text-primary-foreground mb-0.5">
                                {a.patientName.split(" ")[0]}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
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
