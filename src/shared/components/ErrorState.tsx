import { useI18n } from "@/shared/i18n";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();

  return (
    <Alert variant="destructive" className="max-w-lg mx-auto">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title ?? t("common.error")}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{message ?? t("common.errorMessage")}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {t("common.retry")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
