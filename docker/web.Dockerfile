FROM node:22-alpine AS build
WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web/ .

ARG API_URL=""
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=build /app/dist/web/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
