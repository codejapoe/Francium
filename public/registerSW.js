if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
        })
        .catch((err) => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
}