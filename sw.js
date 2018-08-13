/*
global caches, self, addEventListener, CACHE_DYNAMIC_NAME, CACHE_CONTAINING_ERROR_MESSAGES, fetch
*/

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('cache').then(function (cache) {
      let arr = [
        './animate.css',
        './material-switch.css',
        './bootstrap.min.css',
        './js/settings.js',
        './js/main.js',
        './index.html',
        './',
        'assets/cracked.png',
        'assets/cracked64.png',
        './game.html',
        'fonts/JosefinSans-Regular.ttf',
        'fonts/JosefinSans-Bold.ttf',
        'fontawesome/css/all.min.css',
        'fontawesome/webfonts/fa-solid-900.woff2',
        'fontawesome/webfonts/fa-regular-400.woff2'
      ]
      for (var i in arr) {
        let e = arr[i]
        cache.add(e)
      }
      return cache
    })
  )
})

addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request, {
      ignoreSearch: true
    }).then(function (response) {
      if (response) {
        console.log("From cache!")
        return response // if valid response is found in cache return it
      } else {
        console.log("Fetch from internet!")
        return fetch(event.request) // fetch from internet
          .then(function (res) {
            return caches.open('cache')
              .then(function (cache) {
                cache.put(event.request.url, res.clone()) // save the response for future
                return res // return the fetched data
              })
          })
          .catch(function (err) { // fallback mechanism
            console.error(err)
            return caches.open('cache')
              .then(function (cache) {
                return cache.match('./index.html')
              })
          })
      }
    })
  )
})
