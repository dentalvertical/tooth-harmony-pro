import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useI18n, Lang } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { lang, setLang } = useI18n();

  const toggleLang = () => {
    setLang(lang === "uk" ? "en" : ("uk" as Lang));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <SidebarTrigger className="ml-0" />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
              {lang === "uk" ? "UA" : "EN"}
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
