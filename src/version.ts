/**
 * Informações de Versão e Build do Frontend
 * Valores injetados dinamicamente em tempo de build pelo GitHub Actions ou Vite.
 */
export const APP_VERSION = {
  version: (import.meta.env.VITE_APP_VERSION as string) || '0.1.0',
  buildNumber: (import.meta.env.VITE_BUILD_NUMBER as string) || 'local',
  gitCommit: (import.meta.env.VITE_GIT_COMMIT as string) || 'dev',
  buildTime: (import.meta.env.VITE_BUILD_TIME as string) || '',
  shortCommit: ((import.meta.env.VITE_GIT_COMMIT as string) || 'dev').substring(0, 7),
};
