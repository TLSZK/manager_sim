FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass build-time env vars to Vite
ARG VITE_API_URL
ARG VITE_GEMINI_API_KEY

# Overwrite .env so build args take precedence over the committed .env file
RUN printf "VITE_API_URL=%s\nVITE_GEMINI_API_KEY=%s\n" "$VITE_API_URL" "$VITE_GEMINI_API_KEY" > .env

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]