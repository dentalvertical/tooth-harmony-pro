import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/store";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Smile, Globe } from "lucide-react";
import env from "@/config/env";

const LoginPage = () => {
  const [email, setEmail] = useState(import.meta.env.VITE_SUPERUSER_EMAIL || "admin@clinic.com");
  const [password, setPassword] = useState(import.meta.env.VITE_SUPERUSER_PASSWORD || "password");
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(email, password)) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-primary" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl gradient-primary" />

      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === "uk" ? "en" : "uk")}
          className="gap-2 text-muted-foreground"
        >
          <Globe className="h-4 w-4" />
          {lang === "uk" ? "UA" : "EN"}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-elevated border-border/50 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <Smile className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {env.appName}
          </h1>
          <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clinic.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0 hover:opacity-90">
              {t("login.submit")}
            </Button>
            <p className="text-center text-sm text-muted-foreground cursor-pointer hover:text-primary">
              {t("login.forgot")}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
