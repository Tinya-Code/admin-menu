import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'time12',
  standalone: true,
})
export class Time12Pipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';

    try {
      const [hours, minutes] = value.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return value;

      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, '0');

      return `${hours12}:${minutesStr} ${period}`;
    } catch (e) {
      return value;
    }
  }
}
