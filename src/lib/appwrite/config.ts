import { Client, Databases } from 'appwrite'

export const appwriteConfig = {
    url: import.meta.env.VITE_APPWRITE_URL,
    projectId: import.meta.env.VITE_PROJECT_ID,
    databaseID: import.meta.env.VITE_DATABASE_ID,
    userCollectionID: import.meta.env.VITE_USER_COLLECTION_ID,
    postCollectionID: import.meta.env.VITE_POST_COLLECTION_ID,
    notificationCollectionID: import.meta.env.VITE_NOTIFICATION_COLLECTION_ID,
    commentCollectionID: import.meta.env.VITE_COMMENT_COLLECTION_ID,
    trendingCollectionID: import.meta.env.VITE_TRENDING_COLLECTION_ID,
}

export const client = new Client();

client.setEndpoint(appwriteConfig.url);
client.setProject(appwriteConfig.projectId);

export const databases = new Databases(client);