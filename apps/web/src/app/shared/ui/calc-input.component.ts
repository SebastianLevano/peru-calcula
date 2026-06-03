import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-calc-input',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CalcInputComponent), multi: true }],
  template: `
    <div class="space-y-1">
      <label [for]="inputId" class="block text-sm font-medium text-ink-700">
        {{ label }}
        @if (required) { <span class="text-error-600" aria-hidden="true">*</span> }
      </label>
      @if (hint) {
        <p class="text-xs text-ink-500" [id]="inputId + '-hint'">{{ hint }}</p>
      }
      <div class="relative">
        @if (prefix) {
          <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-ink-600 select-none">
            {{ prefix }}
          </span>
        }
        <input
          [id]="inputId"
          [type]="type"
          [min]="min"
          [max]="max"
          [step]="step"
          [placeholder]="placeholder"
          [class]="inputClass"
          [attr.inputmode]="inputmode"
          [attr.aria-describedby]="hint ? inputId + '-hint' : null"
          [attr.aria-required]="required"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onTouched()" />
      </div>
    </div>
  `,
})
export class CalcInputComponent implements ControlValueAccessor {
  @Input() label    = '';
  @Input() inputId  = '';
  @Input() type     = 'number';
  @Input() prefix   = '';
  @Input() hint     = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step     = 1;

  value: number | string = '';
  onChange  = (_: unknown) => {};
  onTouched = () => {};

  get inputmode(): string {
    if (this.type !== 'number') return 'text';
    return (this.step === 1 && !this.min) ? 'numeric' : 'decimal';
  }

  get inputClass(): string {
    const pad = this.prefix ? 'pl-9' : 'pl-3.5';
    return [
      `block w-full ${pad} pr-3.5 py-2.5 rounded-input border border-line bg-surface`,
      'text-sm text-ink-900 placeholder-ink-500',
      'transition-colors',
      'hover:border-ink-500',
      'focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20',
      'disabled:bg-paper disabled:text-ink-500 disabled:cursor-not-allowed',
    ].join(' ');
  }

  writeValue(val: unknown) { this.value = val as number; }
  registerOnChange(fn: (_: unknown) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }

  onInput(event: Event) {
    const v = (event.target as HTMLInputElement).value;
    this.value = v;
    this.onChange(this.type === 'number' ? Number(v) : v);
  }
}
