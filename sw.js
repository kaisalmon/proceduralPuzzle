console.log("A");
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open("cache").then(function(cache) {
      let arr = [
        './animate.css',
        './material-switch.css',
        './bootstrap.min.css',
        'https://fonts.googleapis.com/css?family=Josefin+Sans',
        'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
        './js/settings.js',
        './js/main.js',
        './index.html',
        './',
        './cracked.png',
        './cracked64.png',
        './game.html'
      ];
      for(var i in arr){
        let e = arr[i]
        console.log("caching", e);
        cache.add(e)
      }
      return cache;
    })
  );
});
console.log("C");

addEventListener('fetch', function(event) {
  console.log("D");
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        console.log("E");
        if (response) {
          return response;     // if valid response is found in cache return it
        } else {
          return fetch(event.request)     //fetch from internet
            .then(function(res) {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then(function(cache) {
                  cache.put(event.request.url, res.clone());    //save the response for future
                  return res;   // return the fetched data
                })
            })
            .catch(function(err) {       // fallback mechanism
              console.log("F");
              return caches.open(CACHE_CONTAINING_ERROR_MESSAGES)
                .then(function(cache) {
                  return cache.match('/offline.html');
                });
            });
        }
      })
  );
});
console.log("G");
