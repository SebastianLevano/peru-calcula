export const environment = {
  production: true,
  apiUrl: '',   // mismo dominio en producción (nginx proxy)
  adsense: {
    clientId: 'ca-pub-XXXXXXXXXXXXXXXX',  // reemplazar con publisher ID real de AdSense
    enabled:  true,
  },
  featureFlags: {
    pdfExport:     true,
    comparador:    true,
    guiasBuscador: true,
    adsEnabled:    true,
  },
};
