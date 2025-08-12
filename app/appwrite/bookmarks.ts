import { ID, Query } from "appwrite";
import { appwriteConfig, database } from "./client";

// Add a bookmark
export const addBookmark = async (userId: string, tripId: string) => {
  try {
    const document = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      ID.unique(),
      {
        userId,
        tripId,
        createdAt: new Date().toISOString(),
      }
    );
    return document;
  } catch (e) {
    console.log("Error adding bookmark", e);
  }
};

export const removeBookmark = async (bookmarkId: string) => {
  try {
    await database.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      bookmarkId
    );
  } catch (e) {
    console.log("Error removing bookmark", e);
  }
};

export const getBookmarksByUserId = async (userId: string) => {
  try {
    const booksmarks = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.bookmarkCollectionId,
      [Query.equal("userId", userId)]
    );
    return booksmarks;
    // redirect to saved trips page
  } catch (e) {
    console.log("Error getting bookmarks for the user", e);
  }
};
