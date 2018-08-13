tsc -p tsconfig.json &&
browserify main/main.js -o js/main.js &&
browserify  -t vueify  main/settings.js -o js/settings.js &&
rm main/*.js && rm main/*.*.map && rm js/*.js.tmp* &&
uglifyjs js/main.js --compress -o js/main.min.js &&
uglifyjs js/settings.js --compress -o js/settings.min.js
