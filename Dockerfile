FROM node:15.5.0
WORKDIR /usr/src/app
COPY ./ ./
RUN yarn
EXPOSE 8080
CMD [ "yarn", "run", "production" ]