FROM node:18-slim
WORKDIR /app
COPY package*.json ./
# Paketleri temizce kur
RUN npm install --quiet
COPY . .
ENV TERM=xterm-256color
CMD ["node", "index.js"]