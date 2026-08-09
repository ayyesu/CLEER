export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDate(date: Date | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function truncatePath(path: string, maxLen = 60): string {
  if (path.length <= maxLen) return path;
  const start = path.slice(0, maxLen / 2 - 2);
  const end = path.slice(-(maxLen / 2 - 2));
  return `${start}…${end}`;
}
