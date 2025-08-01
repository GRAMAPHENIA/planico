import { ScheduleBlock } from '@/lib/types';
import { differenceInMinutes, subMinutes } from 'date-fns';

export interface ReminderOptions {
  minutesBefore: number;
  enabled: boolean;
  type: 'notification' | 'email' | 'both';
}

export class ReminderService {
  private static reminders = new Map<string, NodeJS.Timeout>();

  static scheduleReminder(
    block: ScheduleBlock, 
    options: ReminderOptions = { minutesBefore: 15, enabled: true, type: 'notification' }
  ): void {
    if (!options.enabled) return;

    const reminderTime = subMinutes(new Date(block.startTime), options.minutesBefore);
    const now = new Date();
    const msUntilReminder = reminderTime.getTime() - now.getTime();

    // Only schedule if reminder is in the future
    if (msUntilReminder > 0) {
      const timeoutId = setTimeout(() => {
        this.sendReminder(block, options);
      }, msUntilReminder);

      this.reminders.set(block.id, timeoutId);
    }
  }

  private static async sendReminder(block: ScheduleBlock, options: ReminderOptions): Promise<void> {
    const message = `Recordatorio: "${block.title}" comienza en ${options.minutesBefore} minutos`;

    if (options.type === 'notification' || options.type === 'both') {
      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Recordatorio de Planico', {
          body: message,
          icon: '/favicon.ico',
          tag: block.id,
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Recordatorio de Planico', {
            body: message,
            icon: '/favicon.ico',
            tag: block.id,
          });
        }
      }
    }

    // Email reminder would be implemented here
    if (options.type === 'email' || options.type === 'both') {
      // TODO: Implement email reminder service
      console.log('Email reminder:', message);
    }

    // Clean up
    this.reminders.delete(block.id);
  }

  static cancelReminder(blockId: string): void {
    const timeoutId = this.reminders.get(blockId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reminders.delete(blockId);
    }
  }

  static requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }
}