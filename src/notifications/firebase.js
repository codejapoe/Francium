// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { databases } from "@/lib/appwrite/config"
import { appwriteConfig } from "@/lib/appwrite/config"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const generateToken = async (user_id) => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
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