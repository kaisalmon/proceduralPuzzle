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
        'fonts/all.min.css',
        'fonts/fontawesome.css',
        'webfonts/fa-solid-900.ttf'
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
      console.log('E')
      if (response) {
        return response // if valid response is found in cache return it
      } else {
        return fetch(event.request) // fetch from internet
          .then(function (res) {
            return caches.open(CACHE_DYNAMIC_NAME)
              .then(function (cache) {
                cache.put(event.request.url, res.clone()) // save the response for future
                return res // return the fetched data
              })
          })
          .catch(function () { // fallback mechanism
            return caches.open(CACHE_CONTAINING_ERROR_MESSAGES)
              .then(function (cache) {
                return cache.match('./index.html')
              })
          })
      }
    })
  )
})
