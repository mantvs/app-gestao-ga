# App Web - Gestão de Análises

Este é um projeto web desenvolvido para gerenciar e analisar dados em tempo real. O objetivo é fornecer uma plataforma flexível e escalável, com um backend robusto, interface interativa e integração com tecnologias de ponta.

## Tecnologias Usadas

- **Backend**: Python, FastAPI
- **Frontend**: React, JavaScript
- **Banco de Dados**: MySQL
- **Cache**: Redis
- **Proxy Reverso**: Nginx

## Configuração de Desenvolvimento

Para rodar o ambiente de desenvolvimento localmente, utilize o Docker e a extensão Dev Containers do VS Code. Isso irá configurar automaticamente o ambiente com todos os serviços necessários.

### Passos para Desenvolvimento

1. Clone o repositório:

   git clone https://github.com/seu-usuario/app-gestao-ga.git
   cd app-gestao-ga

2. Abra o projeto no VS Code e selecione a opção para abrir no Dev Container quando solicitado.

3. Para rodar o ambiente, execute:

docker-compose -f docker-compose.dev.yml up --build

4. Acesse a aplicação através dos endpoints configurados no docker-compose.dev.yml.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para enviar pull requests, relatar problemas ou sugerir melhorias


