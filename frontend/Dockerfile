FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache build-base cairo-dev pango-dev jpeg-dev giflib-dev
RUN npm install

COPY . .
# For network access, we must tell Next.js to listen on 0.0.0.0
EXPOSE 3000