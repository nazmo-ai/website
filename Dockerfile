# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so the endpoint must be present here
# rather than at container start. Empty by default: the site then renders the
# waitlist as closed instead of shipping a form that discards signups.
ARG VITE_WAITLIST_ENDPOINT=""
ENV VITE_WAITLIST_ENDPOINT=$VITE_WAITLIST_ENDPOINT

RUN npm run build

# ---- Serve stage ------------------------------------------------------------
FROM nginx:1.27-alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
