# Etapa 1: build do React app
FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Etapa 2: imagem final com NGINX
FROM nginx:stable-alpine

# Instala utilitários como sed (alpine usa apk)
RUN apk add --no-cache sed

# Copia os arquivos da pasta build para o nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Substitui URLs nos arquivos JS
RUN find /usr/share/nginx/html/static/js -name "*.js" -exec sed -i 's|http://localhost:8000|http://5.189.177.211:8000|g' {} \;

# Expõe a porta usada pelo NGINX
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
