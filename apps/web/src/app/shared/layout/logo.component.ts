import { Component } from '@angular/core';

/** Marca "Boleta": documento con líneas de monto y check de verificación. */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg viewBox="0 0 64 64" fill="none" class="h-full w-full" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="12" fill="#0a564e" />
      <path fill="#faf9f5" d="M20 13h17.5L46 21.5V49a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" />
      <path fill="#cfe6e1" d="M37.5 13 46 21.5h-6.5a2 2 0 0 1-2-2V13z" />
      <rect x="23" y="26" width="14" height="2.6" rx="1.3" fill="#0d6e63" />
      <rect x="23" y="32" width="17" height="2.6" rx="1.3" fill="#a3d0c7" />
      <circle cx="38" cy="42" r="9" fill="#d4791a" />
      <path d="m34 42 3 3 5-6" fill="none" stroke="#faf9f5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `,
})
export class LogoComponent {}
