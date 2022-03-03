FROM node:lts-alpine as builder
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
RUN npm ci
RUN npm run build

FROM node:lts-alpine as runner
WORKDIR /app
COPY --from=builder /app/dist /app
CMD node /app/dist/index.js