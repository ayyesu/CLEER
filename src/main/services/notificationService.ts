import { Notification } from 'electron';

export interface NotificationData {
  title: string;
  body: string;
  scanSummary?: {
    totalEntries: number;
    totalBytes: number;
    topCategories: Array<{ category: string; bytes: number }>;
  };
}

export class NotificationService {
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  show(data: NotificationData): void {
    if (!this.enabled || !Notification.isSupported()) {
      return;
    }

    const notification = new Notification({
      title: data.title,
      body: data.body,
      silent: false,
    });

    notification.on('click', () => {
      this.emit('notification-clicked');
    });

    notification.show();
  }

  showScanComplete(totalEntries: number, totalBytes: number): void {
    const bodyText =
      totalEntries === 0
        ? 'No reclaimable space found. Your system is clean!'
        : `Found ${totalEntries.toLocaleString()} items using ${formatBytes(totalBytes)}.`;

    this.show({
      title: 'CLEER Scan Complete',
      body: bodyText,
    });
  }

  private listeners: Map<string, Array<() => void>> = new Map();

  on(event: string, callback: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string): void {
    this.listeners.get(event)?.forEach((cb) => cb());
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function createNotificationService(): NotificationService {
  return new NotificationService();
}
