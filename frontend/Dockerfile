FROM node:23-alpine3.20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["sh", "-c", "envsubst < /usr/share/nginx/html/config.js > /usr/share/nginx/html/config.template.js && mv /usr/share/nginx/html/config.template.js /usr/share/nginx/html/config.js && exec nginx -g 'daemon off;'"]
