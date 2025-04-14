# Etapa 1: build do React app
FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa 2: imagem final com NGINX
FROM nginx:stable-alpine

# Copia os arquivos da pasta build para o nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Expõe a porta usada pelo NGINX
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]