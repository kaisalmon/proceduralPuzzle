tsc -p tsconfig.json &&
echo "done compiling" &&
browserify --im main/main.js -o public/js/main.js &&
browserify --im  -t vueify  main/settings.js -o public/js/settings.js &&
echo "done browerfiying" &&
cp main/*.js cmd &&
perl -pi -e 's/main/cmd/g' cmd/*.js &&
return 0
#uglifyjs js/main.js --compress -o js/main.min.js &&
#uglifyjs js/settings.js --compress -o js/settings.min.js &&
#echo "done uglifying"
