# Etapa 1: build do React app
FROM node:20 AS builder

WORKDIR /app

COPY . .

# Substitui URLs nos arquivos JS
RUN sed -i 's|http://localhost:8000/api|/api|g' src/components/AuthContext.js
RUN sed -i 's|http://localhost:8000/api|/api|g' src/pages/Accounts.js
RUN sed -i 's|http://localhost:8000/api|/api|g' src/pages/Dashboard.js

RUN npm install
RUN npm run build

# Etapa 2: imagem final com NGINX
FROM nginx:stable-alpine

# Instala utilitários como sed (alpine usa apk)
RUN apk add --no-cache sed

# Copia os arquivos da pasta build para o nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Substitui a config padrão do NGINX por uma personalizada
COPY nginx-homolog.conf /etc/nginx/conf.d/default.conf

# Expõe a porta usada pelo NGINX
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
