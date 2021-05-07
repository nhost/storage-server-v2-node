from node:14-alpine

ENV PGOPTIONS "-c search_path=storage"

WORKDIR /app
COPY . .
RUN yarn install
RUN yarn run build

EXPOSE 5000
CMD ["yarn", "run", "start"]