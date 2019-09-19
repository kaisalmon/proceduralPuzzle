FROM node
LABEL author="Kai Salmon <kaisalmon@hotmail.com>"
COPY package.json .
WORKDIR /usr/src/app
RUN  npm install
RUN  npm install -g typescript@2.9.2
RUN  npm install -g browserify
RUN  npm install -g uglify-js
COPY package*.json ./
RUN npm install
COPY . .
COPY build.sh ./
RUN chmod +x ./build.sh
RUN ./build.sh
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]
