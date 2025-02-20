import { ID, Query } from "appwrite"
import { NewUser, ExistingUser } from "@/types";
import { appwriteConfig, databases } from "./config";
import Cookies from "js-cookie";
import axios from "axios";
import bcrypt from "bcryptjs";
import { isEmail } from "../functions/email-validation";
import { hashPassword, encryptPassword } from "../functions/password-manager";

export async function createUserAccount(user: NewUser) {
  try {
    let emailResponse = await databases.listDocuments(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      [
        Query.equal('email', user.email)
      ]
    );

    if (emailResponse.total > 0) {
      return 409;
    }

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

    const user_id = ID.unique();
    await databases.createDocument(
      appwriteConfig.databaseID,
      appwriteConfig.userCollectionID,
      user_id,
      {
        name: user.name,
        email: user.email,
        username: user.username,
        password: hashPassword(user.password),
      }
    );

    Cookies.set('user_id', user_id, { expires: 365 });
    Cookies.set('email', user.email, { expires: 365 });
    Cookies.set('password', encryptPassword(user.password), { expires: 365 });

    return 200;

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

    if (response.total === 1) {
      const document = response.documents[0];
      const isMatch = await bcrypt.compare(user.password, document.password);

      if (isMatch) {
        Cookies.set("user_id", document.$id, { expires: 365 });
        Cookies.set("email", document.email, { expires: 365 });
        Cookies.set("password", encryptPassword(user.password), { expires: 365 });

        return 200;
      } else {
        return 401;
      }
    }

    return 404;
  } catch (error) {
    return 500;
  }
}

export async function GoogleLogin(response) {
  try {
    const res = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `${response.token_type} ${response.access_token}`,
        }
      }
    );

    Cookies.set('email', res.data.email, { expires: 365 });
    Cookies.set('password', encryptPassword(import.meta.env.VITE_GOOGLE_PASSWORD), { expires: 365 });
    Cookies.set('access_token', response.access_token, { expires: 365 });
  
    if (res.status === 200) {
      const responseData = databases.listDocuments(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        [
          Query.equal('email', res.data.email)
        ]
      );
  
      let user_id = ID.unique();
      if ((await responseData).total === 0) {
        const username = res.data.name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();


        await databases.createDocument(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          user_id,
          {
            name: res.data.name,
            email: res.data.email,
            username: username,
            password: hashPassword(import.meta.env.VITE_GOOGLE_PASSWORD),
            profile: res.data.picture.replace("s96-c", "s800-c"),
            access_token: response.access_token
          }
        );

      } else {
        // Existing user
        user_id = (await responseData).documents[0].$id;
      }
      
      Cookies.set('user_id', user_id, { expires: 365 });
    }
    
    return 200;
  } catch (error) {
    return 500;
  }
}

export async function GoogleDriveLogin(response) {
  try {
    const res = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `${response.token_type} ${response.access_token}`,
        }
      }
    );

    Cookies.set('access_token', response.access_token, { expires: 365 });
  
    if (res.status === 200) {
      const responseData = databases.listDocuments(
        appwriteConfig.databaseID,
        appwriteConfig.userCollectionID,
        [
          Query.equal('email', res.data.email)
        ]
      );
  
      if ((await responseData).total === 1) {
        const user = await databases.updateDocument(
          appwriteConfig.databaseID,
          appwriteConfig.userCollectionID,
          (await responseData).documents[0].$id,
          {
            access_token: response.access_token
          }
        );
      }
    }
    
    return 200;
  } catch (error) {
    return 500;
  }
}