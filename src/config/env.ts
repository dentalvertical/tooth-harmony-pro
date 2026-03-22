/**
 * Environment configuration
 * Centralizes all environment-dependent values
 */

interface EnvConfig {
  apiBaseUrl: string;
  appName: string;
  isDev: boolean;
  isProd: boolean;
  defaultLang: 'uk' | 'en';
  defaultCurrency: string;
  maxUploadSizeMB: number;
}

const defaultApiBaseUrl = import.meta.env.DEV
  ? "/api"
  : "/api";

const env: EnvConfig = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/$/, ""),
  appName: import.meta.env.VITE_APP_NAME || 'DentaCRM',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  defaultLang: (import.meta.env.VITE_DEFAULT_LANG as 'uk' | 'en') || 'uk',
  defaultCurrency: import.meta.env.VITE_CURRENCY || '₴',
  maxUploadSizeMB: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB) || 10,
};

export default env;
