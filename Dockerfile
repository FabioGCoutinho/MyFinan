# Use a imagem oficial do Node.js
FROM node:22-alpine

# Defina o diretório de trabalho
WORKDIR /app

# Copie os arquivos de package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
COPY . .

# Construa a aplicação Next.js
RUN npm run build

# Expone a porta 80
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["npm", "start"]