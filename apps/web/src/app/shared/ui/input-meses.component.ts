import { Component, input, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-input-meses',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="space-y-2">
      <p class="text-sm font-medium text-gray-700">{{ label() }}</p>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
        @for (mes of mesesLabels(); track mes + $index; let i = $index) {
          <div class="space-y-0.5">
            <label class="block text-xs text-gray-500 text-center">{{ mes }}</label>
            <div class="relative">
              <span class="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">S/</span>
              <input
                type="number" min="0" step="0.01"
                [value]="_valores()[i] || ''"
                (input)="setValor(i, $event)"
                placeholder="0"
                class="w-full pl-6 pr-1 py-1.5 rounded border border-gray-300 text-xs text-right
                       focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        }
      </div>
      <div class="flex justify-between items-center text-xs text-gray-600
                  bg-white rounded border border-gray-200 px-3 py-1.5">
        <span>Total: <strong>S/ {{ total() | number:'1.2-2' }}</strong></span>
        <span>
          Promedio mensual:
          <strong class="text-blue-700">S/ {{ promedio() | number:'1.2-2' }}</strong>
        </span>
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
