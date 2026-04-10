FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run prisma:generate

EXPOSE 3000

CMD ["node", "src/index.js"]