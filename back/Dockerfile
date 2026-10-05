FROM node:22-alpine
RUN npm install -g npm@12
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3002
CMD ["npm", "run", "start:dev"]
