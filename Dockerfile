FROM node
LABEL author="Kai Salmon <kaisalmon@hotmail.com>"
RUN npm install -g typescript
RUN npm install
COPY package.json .
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY build.sh ./
RUN chmod +x ./build.sh
RUN ./build.sh
COPY . .
EXPOSE 5000
CMD ["npm", "run", "start"]
