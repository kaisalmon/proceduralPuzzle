tsc -p tsconfig.json &&
echo "done compiling" &&
browserify main/main.js -o js/main.js &&
browserify  -t vueify  main/settings.js -o js/settings.js &&
echo "done browerfiying" &&
mv main/*.js cmd &&
perl -pi -e 's/main/cmd/g' cmd/*.js &&
rm main/*.js main/*.*.map rm js/*.js.tmp* || true &&
echo "done cleanup" &&
uglifyjs js/main.js --compress -o js/main.min.js &&
uglifyjs js/settings.js --compress -o js/settings.min.js &&
echo "done uglifying"
