import { appwriteConfig, databases } from "@/lib/appwrite/config";

export async function fetchUserDetails(userIds: string[]) {
    try {
      const userPromises = userIds.map(userId =>
        databases.getDocument(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          userId
        )
      );
      return await Promise.all(userPromises);
    } catch (error) {
      return [];
    }
}