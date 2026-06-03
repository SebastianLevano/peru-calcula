export const environment = {
  production: true,
  apiUrl: '',                        // mismo dominio en prod (nginx proxy)
  ga4MeasurementId: 'G-XXXXXXXXXX', // ← reemplazar con el Measurement ID real de GA4
  adsense: {
    clientId: 'ca-pub-XXXXXXXXXXXXXXXX', // ← reemplazar con el Publisher ID real de AdSense
    enabled:  true,
  },
  featureFlags: {
    pdfExport:     true,
    comparador:    true,
    guiasBuscador: true,
    adsEnabled:    true,
  },
};
