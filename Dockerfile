FROM node:20
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY ./ ./
EXPOSE 4000
CMD ["npm","run","start"]