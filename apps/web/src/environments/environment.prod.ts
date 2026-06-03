export const environment = {
  production: true,
  apiUrl: '',   // mismo dominio en producción (nginx proxy)
  featureFlags: {
    pdfExport:     false,
    comparador:    false,
    guiasBuscador: false,
  },
};
