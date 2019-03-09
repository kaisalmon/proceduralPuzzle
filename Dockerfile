FROM node
LABEL author="Stuart Radforth <stuart@coinmode.com>"
RUN npm install
COPY package.json .
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "build"]
RUN npm run build
EXPOSE 5000
CMD ["npm", "run", "start"]
