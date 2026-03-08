FROM node:20-alpine

WORKDIR /app

# copy package files first for layer caching
COPY package.json package-lock.json ./

# install dependencies
RUN npm ci

# copy the rest of the app
COPY . .

# build the Next.js app for production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]