import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from './analytics.service';

/**
 * Genera PDF client-side de forma no bloqueante (ADR-15).
 * Usa jsPDF + html2canvas para capturar el ResultCard del DOM.
 * El import dinámico evita que los bundles de SSR fallen.
 */
@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly platform   = inject(PLATFORM_ID);
  private readonly analytics  = inject(AnalyticsService);

  async descargar(elementId: string, nombreArchivo: string, calculadoraSlug: string, modulo: 'laboral' | 'tributario' | 'finanzas'): Promise<void> {
    if (!isPlatformBrowser(this.platform)) return;

    const el = document.getElementById(elementId);
    if (!el) return;

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    const canvas  = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pdfW  = pdf.internal.pageSize.getWidth();
    const pdfH  = (canvas.height * pdfW) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`${nombreArchivo}.pdf`);

    this.analytics.track({ tipoEvento: 'export_pdf', calculadoraSlug, modulo });
  }
}
