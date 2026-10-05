FROM node:22-alpine
RUN npm install -g npm@12
# Outils usuels dans le container de dev, et binaires npm locaux (ng, nest, vitest...) dans le PATH
RUN apk add --no-cache bash git
ENV PATH=/app/node_modules/.bin:$PATH
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4200
CMD ["sh", "-c", "npm install --no-audit --no-fund && npm start -- --host 0.0.0.0 --poll 1000"]
