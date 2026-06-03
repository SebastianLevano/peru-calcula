export const environment = {
  production: false,
  apiUrl: 'http://localhost:5117',
  ga4MeasurementId: '',          // vacío en dev — no carga GA4
  adsense: {
    clientId: '',                 // vacío en dev — no carga AdSense
    enabled:  false,
  },
  featureFlags: {
    pdfExport:     true,
    comparador:    true,
    guiasBuscador: true,
    adsEnabled:    false,
  },
};
