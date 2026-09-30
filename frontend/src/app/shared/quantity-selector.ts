import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-quantity',
  template: `<div class="inline-flex items-center rounded-full border border-line bg-paper">
    <button
      type="button"
      class="h-10 w-10 rounded-full disabled:opacity-30"
      aria-label="Reducir cantidad"
      [disabled]="value() <= 1"
      (click)="changed.emit(value() - 1)"
    >
      −</button
    ><span class="min-w-6 text-center text-sm" aria-live="polite">{{ value() }}</span
    ><button
      type="button"
      class="h-10 w-10 rounded-full disabled:opacity-30"
      aria-label="Aumentar cantidad"
      [disabled]="value() >= max()"
      (click)="changed.emit(value() + 1)"
    >
      +
    </button>
  </div>`,
})
export class QuantitySelector {
  value = input(1);
  max = input(999);
  changed = output<number>();
}
