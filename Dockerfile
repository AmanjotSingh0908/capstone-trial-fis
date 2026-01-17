FROM node:18-alpine

RUN apk add --no-cache stress-ng iproute2

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]