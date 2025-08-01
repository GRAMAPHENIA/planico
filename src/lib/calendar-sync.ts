import { ScheduleBlock } from '@/lib/types';
import { format } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export class CalendarSyncService {
  // Generate .ics file content for calendar import
  static generateICSFile(blocks: ScheduleBlock[]): string {
    const icsHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Planico//Planico Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ].join('\r\n');

    const icsFooter = 'END:VCALENDAR';

    const events = blocks.map(block => this.blockToICSEvent(block)).join('\r\n');

    return [icsHeader, events, icsFooter].join('\r\n');
  }

  private static blockToICSEvent(block: ScheduleBlock): string {
    const startTime = this.formatDateForICS(new Date(block.startTime));
    const endTime = this.formatDateForICS(new Date(block.endTime));
    const uid = `${block.id}@planico.app`;
    const timestamp = this.formatDateForICS(new Date());

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${this.escapeICSText(block.title)}`,
      block.description ? `DESCRIPTION:${this.escapeICSText(block.description)}` : '',
      `CATEGORIES:${this.escapeICSText(block.category.name)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  }

  private static formatDateForICS(date: Date): string {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  }

  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  // Download ICS file
  static downloadICSFile(blocks: ScheduleBlock[], filename: string = 'planico-calendar.ics'): void {
    const icsContent = this.generateICSFile(blocks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate Google Calendar URL
  static generateGoogleCalendarURL(block: ScheduleBlock): string {
    const baseURL = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: block.title,
      dates: `${this.formatDateForGoogle(new Date(block.startTime))}/${this.formatDateForGoogle(new Date(block.endTime))}`,
      details: block.description || '',
      location: '',
    });

    return `${baseURL}?${params.toString()}`;
  }

  private static formatDateForGoogle(date: Date): string {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  }

  // Generate Outlook Calendar URL
  static generateOutlookCalendarURL(block: ScheduleBlock): string {
    const baseURL = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      subject: block.title,
      startdt: new Date(block.startTime).toISOString(),
      enddt: new Date(block.endTime).toISOString(),
      body: block.description || '',
      location: '',
    });

    return `${baseURL}?${params.toString()}`;
  }

  // Sync single block to external calendar
  static async syncBlockToExternalCalendar(
    block: ScheduleBlock, 
    provider: 'google' | 'outlook' | 'ics'
  ): Promise<void> {
    switch (provider) {
      case 'google':
        window.open(this.generateGoogleCalendarURL(block), '_blank');
        break;
      case 'outlook':
        window.open(this.generateOutlookCalendarURL(block), '_blank');
        break;
      case 'ics':
        this.downloadICSFile([block], `${block.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
        break;
    }
  }
}