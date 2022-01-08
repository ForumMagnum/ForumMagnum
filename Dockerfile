FROM node:15.5.0
# Transcrypt dependency
RUN apt-get update && apt-get install -y bsdmainutils
# Install transcrypt for EA Forum
RUN curl -sSLo /usr/local/bin/transcrypt https://raw.githubusercontent.com/elasticdog/transcrypt/2f905dce485114fec10fb747443027c0f9119caa/transcrypt && chmod +x /usr/local/bin/transcrypt
WORKDIR /usr/src/app
# Copy only files necessary for yarn install, to avoid spurious changes
# triggering re-install
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY public/lesswrong-editor public/lesswrong-editor
COPY scripts/postinstall.sh scripts/postinstall.sh
# clear the cache -- it's not useful and it adds to the time docker takes to
# save the layer diff
RUN yarn install && yarn cache clean
COPY . .
EXPOSE 8080
EXPOSE 3000
EXPOSE 3001
CMD [ "yarn", "run", "production" ]
