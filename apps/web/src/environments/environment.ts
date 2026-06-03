export const environment = {
  production: false,
  apiUrl: 'http://localhost:5117',
  adsense: {
    clientId: '',          // vacío en dev — no carga AdSense
    enabled:  false,
  },
  featureFlags: {
    pdfExport:     true,
    comparador:    true,
    guiasBuscador: true,
    adsEnabled:    false,  // activar en prod cuando el publisher ID esté aprobado
  },
};
