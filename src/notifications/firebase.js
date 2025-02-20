// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { databases } from "@/lib/appwrite/config"
import { appwriteConfig } from "@/lib/appwrite/config"
import Cookies from "js-cookie";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAitrJKw0H-VyILjf3ThRWxci21-0sPwhM",
  authDomain: "francium-app.firebaseapp.com",
  databaseURL: "https://francium-app-default-rtdb.firebaseio.com",
  projectId: "francium-app",
  storageBucket: "francium-app.appspot.com",
  messagingSenderId: "919389091275",
  appId: "1:919389091275:web:0c3b77c4ff128ba468724e",
  measurementId: "G-73X1ZB157T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const generateToken = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: "BCBcNGTKe_pnknhch1ImYGCK5nEi9UAp7AVWQq7PG3hsfZHogi0ETDdOfq9dn2Yf3QSTUgido-eA9K5PeRFv3CI"
        });
        Cookies.set('fcm', token);
        const user_id = Cookies.get('user_id');
        const userData = await databases.getDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            user_id
        );
        const currentTokens = userData.fcm || [];
        if (!currentTokens.includes(token)) {
            await databases.updateDocument(
                appwriteConfig.databaseID,
                appwriteConfig.userCollectionID,
                user_id,
                {
                    fcm: [...new Set([token, ...currentTokens])]
                }
            );
        }
    }
}