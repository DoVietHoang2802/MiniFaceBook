const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const relativePath = path.replace(/^\/?(?:api\/)?/, '');
  return `${apiBaseUrl}/${relativePath}`;
}
