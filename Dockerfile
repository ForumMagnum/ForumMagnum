FROM node:15.5.0
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
