FROM node:15.5.0
# Transcrypt dependency
RUN apt-get update && apt-get install -y bsdmainutils
# Install transcrypt for EA Forum
RUN curl -sSLo /usr/local/bin/transcrypt https://raw.githubusercontent.com/elasticdog/transcrypt/v2.1.0/transcrypt && chmod +x /usr/local/bin/transcrypt
WORKDIR /usr/src/app
# Copy only files necessary for yarn install, to avoid spurious changes
# triggering re-install
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY public/lesswrong-editor public/lesswrong-editor
COPY scripts/postinstall.sh scripts/postinstall.sh
RUN yarn
COPY . .
EXPOSE 8080
CMD [ "yarn", "run", "production" ]
