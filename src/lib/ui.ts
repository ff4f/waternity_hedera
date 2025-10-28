// Shared UI utilities
// Centralized status-to-class mapping for consistent badges across the app
export function getStatusColor(status: string): string {
  const s = (status || '').toString().toLowerCase()
  if (['executed', 'completed', 'approved', 'success', 'successful'].includes(s)) return 'status-executed'
  if (['failed', 'error', 'rejected', 'suspended'].includes(s)) return 'status-failed'
  if (['pending', 'processing', 'in_progress', 'in-progress', 'queued'].includes(s)) return 'status-pending'
  if (['active', 'online', 'running'].includes(s)) return 'status-active'
  if (['maintenance', 'maintaining', 'upgrading'].includes(s)) return 'status-maintenance'
  if (['inactive', 'offline', 'stopped', 'disabled'].includes(s)) return 'status-inactive'
  return 'status-inactive'
}