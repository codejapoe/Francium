// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  apiKey: 'AIzaSyAitrJKw0H-VyILjf3ThRWxci21-0sPwhM',
  authDomain: 'francium-app.firebaseapp.com',
  databaseURL: 'https://francium-app-default-rtdb.firebaseio.com',
  projectId: 'francium-app',
  storageBucket: 'francium-app.appspot.com',
  messagingSenderId: '919389091275',
  appId: '1:919389091275:web:0c3b77c4ff128ba468724e',
  measurementId: 'G-73X1ZB157T'
};

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const app = firebase.initializeApp(firebaseConfig);
/*
const messaging = firebase.messaging(app);

messaging.onBackgroundMessage((payload) => {
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "./logo.png"
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
*/