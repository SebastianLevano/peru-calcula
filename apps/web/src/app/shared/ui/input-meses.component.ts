import { Component, input, computed, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-input-meses',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="space-y-2">
      <p class="text-sm font-medium text-ink-700">{{ label() }}</p>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
        @for (mes of mesesLabels(); track mes + $index; let i = $index) {
          <div class="space-y-0.5">
            <label class="block text-center text-xs text-ink-500">{{ mes }}</label>
            <div class="relative">
              <span class="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 select-none text-xs font-medium text-ink-600">S/</span>
              <input
                type="number" min="0" step="0.01"
                inputmode="decimal"
                [value]="_valores()[i] || ''"
                (input)="setValor(i, $event)"
                placeholder="0"
                class="w-full rounded-input border border-line bg-surface py-1.5 pl-6 pr-1 text-right text-xs text-ink-900
                       placeholder-ink-500
                       hover:border-ink-500
                       focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20" />
            </div>
          </div>
        }
      </div>
      <div class="flex items-center justify-between rounded-input border border-line bg-paper px-3 py-1.5 text-xs text-ink-600">
        <span>Total: <strong class="tabular text-ink-900">S/ {{ total() | number:'1.2-2' }}</strong></span>
        <span>Promedio: <strong class="tabular text-primary-700">S/ {{ promedio() | number:'1.2-2' }}</strong></span>
      </div>
    </div>
  `,
})
export class InputMesesComponent implements OnInit {
  readonly label       = input.required<string>();
  readonly mesesLabels = input.required<string[]>();

  readonly _valores = signal<number[]>([]);

  ngOnInit() {
    this._valores.set(this.mesesLabels().map(() => 0));
  }

  setValor(i: number, event: Event) {
    const val = Math.max(0, parseFloat((event.target as HTMLInputElement).value) || 0);
    this._valores.update(v => { const next = [...v]; next[i] = val; return next; });
  }

  readonly total    = computed(() => this._valores().reduce((a, b) => a + b, 0));
  readonly promedio = computed(() => {
    const n = this.mesesLabels().length;
    return n > 0 ? Math.round(this.total() / n * 100) / 100 : 0;
  });

  reset() { this._valores.set(this.mesesLabels().map(() => 0)); }
}
