tsc -p tsconfig.json &&
browserify main/main.js -o js/main.js &&
browserify  -t vueify  main/settings.js -o js/settings.js &&
rm main/*.js
