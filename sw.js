self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open("cache").then(function(cache) {
      return cache.addAll(
        [
          'animate.css',
          'material-switch.css',
          'bootstrap.min.css',
          'https://fonts.googleapis.com/css?family=Josefin+Sans',
          'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
          'js/settings.js',
          'js/main.js',
          'index.html',
          'game.html'
        ]
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      alert("Fish!");
    })
  );
});
