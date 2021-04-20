FROM node:15.5.0
# Transcrypt dependency
RUN apt-get update && apt-get install -y bsdmainutils
# Install transcrypt for EA Forum
RUN curl -sSLo /usr/local/bin/transcrypt https://raw.githubusercontent.com/elasticdog/transcrypt/v2.1.0/transcrypt && chmod +x /usr/local/bin/transcrypt
WORKDIR /usr/src/app
COPY ./ ./
RUN yarn
EXPOSE 8080
CMD [ "yarn", "run", "production" ]
