FROM node:16.19-bullseye-slim

USER root

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --force

COPY . .

EXPOSE 1001

CMD [ "npm", "start" ]
