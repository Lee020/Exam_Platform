FROM node:20-alpine

WORKDIR /app

# Install Angular CLI
RUN npm install -g @angular/cli@18

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application
COPY proxy.conf.json ./
COPY . .

EXPOSE 4200

CMD ["npm", "start"]
