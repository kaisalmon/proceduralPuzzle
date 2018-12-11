tsc -p tsconfig.json &&
echo "done compiling" &&
browserify --im main/main.js -o js/main.js &&
browserify --im  -t vueify  main/settings.js -o js/settings.js &&
echo "done browerfiying" &&
perl -pi -e 's/main/cmd/g' cmd/*.js &&
uglifyjs js/main.js --compress -o js/main.min.js &&
uglifyjs js/settings.js --compress -o js/settings.min.js &&
echo "done uglifying"
