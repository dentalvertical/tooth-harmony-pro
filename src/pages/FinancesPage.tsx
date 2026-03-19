import { useI18n } from "@/lib/i18n";
import { Navigate } from "react-router-dom";

// This legacy page redirects to the feature module version
const FinancesPage = () => <Navigate to="/finances" replace />;
export default FinancesPage;
