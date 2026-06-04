import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { withInterceptors } from '@angular/common/http';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ssrUrlInterceptor } from './core/ssr-url.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // En SSR convierte /api/* en http://api:8080/api/* (URL absoluta para Node.js)
    provideHttpClient(withFetch(), withInterceptors([ssrUrlInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
