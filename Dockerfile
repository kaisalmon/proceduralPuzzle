FROM node
LABEL author="Stuart Radforth <stuart@coinmode.com>"
RUN npm install
COPY package.json .
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY build.sh ./
RUN chmod +x ./build.sh
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]
