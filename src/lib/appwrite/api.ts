import { ID, Query } from "appwrite"
import { NewUser, ExistingUser } from "@/types";
import { account, appwriteConfig, databases } from "./config";
import Cookies from "js-cookie";
import axios from "axios";
import { isEmail } from "../functions/email-validation";

export async function createUserAccount(user: NewUser) {
  try {
    let usernameResponse = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [
        Query.equal('username', user.username)
      ]
    );

    if (usernameResponse.total > 0) {
      return 422;
    }

    try {
      const newAccount = await account.create(
        ID.unique(),
        user.email,
        user.password,
        user.name
      )

      await databases.createDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        ID.unique(),
        {
          account_id: newAccount.$id,
          name: newAccount.name,
          email: newAccount.email,
          username: user.username,
        }
      );

      return 200;
    } catch (error) {
      return 409;
    }
  } catch (error) {
    return 500;
  }
}

export async function loginUserAccount(user: ExistingUser) {
  try {
    const searchField = isEmail(user.id) ? "email" : "username";
    const searchValue = user.id;

    const response = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [Query.equal(searchField, searchValue)]
    );

    if (response.total > 0) {
      try {
        const result = await account.createEmailPasswordSession(response.documents[0].email, user.password)

        if (response.documents[0].account_id !== result.userId) {
          await databases.updateDocument(
            appwriteConfig.databaseID,
            appwriteConfig.userCollectionID,
            response.documents[0].$id,
            {
              account_id: result.userId
            }
          );
        }

        return 200;
      } catch (error) {
        return 401;
      }
    }

    return 404;
  } catch (error) {
    return 500;
  }
}

export async function GoogleDriveLogin(response) {
  try {
    await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `${response.token_type} ${response.access_token}`,
        }
      }
    );

    Cookies.set('access_token', response.access_token, { expires: 1/24 });
    
    return 200;
  } catch (error) {
    return 500;
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await account.getSession('current');
    if (!currentAccount) {
      throw new Error('No session found');
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [Query.equal('email', currentAccount.providerUid)]
    );

    if (currentUser.documents.length === 0) {
      throw new Error('No user document found');
    }

    if (currentUser.documents[0].account_id !== currentAccount.userId) {
      const currentUser2 = await databases.updateDocument(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        currentUser.documents[0].account_id,
        {
          account_id: currentAccount.userId
        }
      );
      return currentUser2;
    }

    return currentUser.documents[0];
  } catch (error) {
    return { 
      "$id": undefined,
      "name": undefined,
      "email": undefined,
      "username": undefined,
      "profile": undefined,
      "verified": undefined,
      "followings": undefined,
      "favorites": undefined,
      "bookmarks": undefined
    };
  }
}

export async function Logout() {
  try {
    await account.deleteSession('current');
    return 200;
  } catch (error) {
    return 500;
  }
}