FROM node:lts-alpine as builder
WORKDIR /app
COPY ./package.json ./package.json
COPY ./package-lock.json ./package-lock.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:lts-alpine as runner
WORKDIR /app
COPY --from=builder /app/dist /app
RUN npx playwright install
VOLUME /data
EXPOSE 3000
ENV USER_DATA_DIR="/data"
ENV NODE_ENV
ENV SLOWNESS
CMD ["node", "/app/dist/index.js"]