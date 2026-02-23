# Node 22.x is LTS
FROM node:22.12.0
ENV IS_DOCKER=true
# Transcrypt dependency
RUN apt-get update && apt-get install -y bsdmainutils
# Install transcrypt for EA Forum
RUN curl -sSLo /usr/local/bin/transcrypt https://raw.githubusercontent.com/elasticdog/transcrypt/2f905dce485114fec10fb747443027c0f9119caa/transcrypt && chmod +x /usr/local/bin/transcrypt
WORKDIR /usr/src/app
# Copy only files necessary for npm install, to avoid spurious changes
# triggering re-install
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY ckEditor ckEditor
COPY scripts/postinstall.sh scripts/postinstall.sh
# clear the cache -- it's not useful and it adds to the time docker takes to
# save the layer diff
RUN npm ci && npm cache clean --force
COPY . .
EXPOSE 8080
CMD [ "npm", "run", "production" ]
