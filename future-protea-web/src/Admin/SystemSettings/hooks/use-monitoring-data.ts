import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Monitoring data from user-service backend.
 * Returns real CPU/memory usage, process uptime (seconds), and service health.
 */
export function useMonitoringQuery() {
  return useQuery({
    queryKey: ['admin', 'system', 'monitoring'],
    queryFn: async () => {
      const response = await api.get('/users/monitoring');
      const d = response.data?.data ?? response.data ?? {};
      const serviceList = (d.services ?? []).map((s: any) => ({
        id: s.id ?? s.name,
        name: s.name,
        status: s.status as 'healthy' | 'degraded' | 'down',
        uptime: s.uptime ?? 0,
        responseTime: s.responseTime ?? 0,
        lastChecked: new Date().toISOString(),
      }));
      return {
        cpu: d.cpu ?? 0,
        memory: d.memory ?? 0,
        disk: d.disk ?? 0,
        uptime: d.uptime ?? 0, // process uptime in seconds
        services: serviceList,
      };
    },
    refetchInterval: 30000,
  });
}
