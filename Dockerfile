FROM node
LABEL author="Kai Salmon <kaisalmon@hotmail.com>"
COPY package.json .
WORKDIR /usr/src/app
RUN npm install -g typescript
RUN npm install -g browserify
RUN npm install -g uglify-js
RUN npm install
COPY package*.json ./
RUN npm install
COPY . .
COPY build.sh ./
RUN chmod +x ./build.sh
RUN ./build.sh
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]
