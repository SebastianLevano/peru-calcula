import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calc-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CalcInputComponent), multi: true }],
  template: `
    <div class="space-y-1">
      <label [for]="inputId" class="block text-sm font-medium text-gray-700">
        {{ label }}
        @if (required) { <span class="text-red-500" aria-hidden="true">*</span> }
      </label>
      @if (hint) {
        <p class="text-xs text-gray-500" [id]="inputId + '-hint'">{{ hint }}</p>
      }
      <div class="relative">
        @if (prefix) {
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm select-none">{{ prefix }}</span>
        }
        <input
          [id]="inputId"
          [type]="type"
          [min]="min"
          [max]="max"
          [step]="step"
          [placeholder]="placeholder"
          [class]="inputClass"
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
  onChange = (_: unknown) => {};
  onTouched = () => {};

  get inputClass() {
    const pad = this.prefix ? 'pl-9' : 'pl-3';
    return `block w-full ${pad} pr-3 py-2.5 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500`.replace(/\s+/g, ' ');
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
