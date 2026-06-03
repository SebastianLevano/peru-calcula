import { Component, Input } from '@angular/core';

export type AlertTone = 'error' | 'warn' | 'ok' | 'info';

/** Mensaje de estado accesible. tone="error" usa role="alert" (lo anuncia el lector). */
@Component({
  selector: 'app-alert',
  standalone: true,
  template: `
    <div class="flex gap-3 rounded-card border p-4 text-sm" [class]="clases"
         [attr.role]="tone === 'error' ? 'alert' : 'status'">
      <svg class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        @if (tone === 'ok') {
          <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clip-rule="evenodd"/>
        } @else if (tone === 'info') {
          <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9Zm1-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clip-rule="evenodd"/>
        } @else {
          <path fill-rule="evenodd" d="M8.3 3.2c.7-1.3 2.6-1.3 3.4 0l6 10.5c.7 1.3-.2 2.8-1.7 2.8H4c-1.5 0-2.4-1.5-1.7-2.8l6-10.5ZM10 7a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
        }
      </svg>
      <div class="space-y-0.5">
        @if (titulo) { <p class="font-semibold">{{ titulo }}</p> }
        <div><ng-content /></div>
      </div>
    </div>
  `,
})
export class AlertComponent {
  @Input() tone: AlertTone = 'info';
  @Input() titulo?: string;

  private static readonly MAP: Record<AlertTone, string> = {
    error: 'border-error-600/25 bg-error-50 text-error-700',
    warn:  'border-warn-600/25 bg-warn-50 text-warn-600',
    ok:    'border-ok-600/25 bg-ok-50 text-ok-600',
    info:  'border-line bg-paper text-ink-700',
  };

  get clases(): string { return AlertComponent.MAP[this.tone]; }
}
