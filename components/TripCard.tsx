import { Link, useLocation, useNavigate } from "react-router";
import { cn, getFirstWord } from "~/lib/utils";
import {
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";
import { useEffect, useState } from "react";
import { account, appwriteConfig, database } from "~/appwrite/client";
import {
  addBookmark,
  getBookmarksByUserId,
  removeBookmark,
} from "~/appwrite/bookmarks";
import { ID, Query } from "appwrite";
import { ToastComponent } from "@syncfusion/ej2-react-notifications";
import { useRef } from "react";
import "@syncfusion/ej2-react-notifications/styles/material.css";

const TripCard = ({
  id,
  name,
  location,
  imageUrl,
  tags,
  price,
  hasRemoveButton,
  hasBookmarkButton,
}: TripCardProps) => {
  const path = useLocation();
  const navigate = useNavigate();

  // for deleting
  const [loading, setLoading] = useState(false);
  // for bookmarking
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  // for likes
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError(null);
    try {
      await database.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.tripCollectionId,
        id
      );
      navigate("/trips");
      showToast("Removed", "The trip has been removed.", "e-toast-success");
    } catch (err: any) {
      showToast(
        "Error",
        "An error has occurred while deleting the trip.",
        "e-toast-danger"
      );
      console.error("Failed to delete document", err);
      setError(err.message || "Error deleting record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchTripData() {
      try {
        // Fetch trip likes count
        const trip = await database.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.tripCollectionId,
          id
        );
        setLikes(trip.likes || 0);

        // Fetch bookmarks
        const user = await account.get();
        const bookmarks = await getBookmarksByUserId(user.$id);
        const bookmark = bookmarks?.documents.find((b) => b.tripId === id);
        if (bookmark) {
          setIsBookmarked(true);
          setBookmarkId(bookmark.$id);
        }

        // Check if this user already liked the trip
        const userLike = await database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.likeCollectionId,
          [Query.equal("tripId", id), Query.equal("userId", user.$id)]
        );

        if (userLike.documents.length > 0) {
          setHasLiked(true);
        }
      } catch (err) {
        // User not logged in or no bookmark
        setIsBookmarked(false);
        setBookmarkId(null);

        console.error("Error fetching trip data", err);
      }
    }
    fetchTripData();
  }, [id]);

  const handleBookmark = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setError(null);
    try {
      const user = await account.get();
      if (!isBookmarked) {
        const bookmark = await addBookmark(user.$id, id);
        if (!bookmark) {
          console.log("Error bookmarking the selected trip");
          return;
        }
        setIsBookmarked(true);
        setBookmarkId(bookmark.$id);
        showToast(
          "Bookmarked",
          "Trip added to your bookmarks.",
          "e-toast-success"
        );
      } else if (bookmarkId) {
        await removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast(
          "Removed",
          "Trip removed from your bookmarks.",
          "e-toast-success"
        );
      }
    } catch (err: any) {
      showToast(
        "Error",
        "An error has occurred while bookmarking/unbookmarking the trip.",
        "e-toast-danger"
      );
      setError(err.message || "Error updating bookmark");
    }
  };

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const user = await account.get();

      if (hasLiked) {
        // Unlike → remove user like document
        const userLike = await database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.likeCollectionId,
          [Query.equal("tripId", id), Query.equal("userId", user.$id)]
        );

        if (userLike.documents.length > 0) {
          await database.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.likeCollectionId,
            userLike.documents[0].$id
          );
        }

        await database.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.tripCollectionId,
          id,
          { likes: likes - 1 }
        );

        setLikes((prev) => prev - 1);
        setHasLiked(false);
      } else {
        // Like → add user like document
        await database.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.likeCollectionId,
          ID.unique(),
          { tripId: id, userId: user.$id }
        );

        await database.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.tripCollectionId,
          id,
          { likes: likes + 1 }
        );

        setLikes((prev) => prev + 1);
        setHasLiked(true);
      }
    } catch (err) {
      showToast(
        "Error",
        "An error has occurred while liking/unliking the trip.",
        "e-toast-danger"
      );
      console.error("Error updating like", err);
    }
  };

  const toastRef = useRef<ToastComponent>(null);

  const showToast = (title: string, content: string, cssClass: string) => {
    toastRef.current?.show({
      title,
      content,
      cssClass,
    });
  };

  return (
    <>
      {/* Full page overlay and spinner during loading */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50 pointer-events-auto">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div
        className={cn("trip-card relative", loading && "pointer-events-none")}
      >
        {hasRemoveButton && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`absolute top-7 left-4 z-10 rounded-full ${
              loading ? "bg-gray-300" : "bg-white"
            } text-black w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-400 cursor-pointer`}
            aria-label="Remove trip"
            title="Remove trip"
            type="button"
          >
            X
          </button>
        )}

        {hasBookmarkButton && (
          <button
            className={`absolute top-6 left-4 z-10 rounded-full "bg-transparent"
            } w-8 h-8 flex items-center justify-center hover:bg-yellow-500 cursor-pointer`}
            aria-label="Bookmark trip"
            title="Bookmark trip"
            type="button"
            onClick={handleBookmark}
          >
            <img
              src={`/assets/icons/${
                isBookmarked ? "bookmark-filled.svg" : "bookmark.svg"
              }`}
              alt="bookmark"
              className="w-5 h-5 object-contain"
            />
          </button>
        )}
        <img src={imageUrl} alt={name} />

        <article>
          <Link
            to={
              path.pathname === "/" || path.pathname.startsWith("/travel")
                ? `/travel/${id}`
                : `/trips/${id}`
            }
          >
            <h2>{name}</h2>
          </Link>

          <figure>
            <img
              src="/assets/icons/location-mark.svg"
              alt="location"
              className="size-4"
            />
            <figcaption>{location}</figcaption>
          </figure>
        </article>

        <div className="mt-5 pl-[18px] pr-3.5 pb-5 flex items-center justify-between">
          <ChipListComponent id="travel-chip">
            <ChipsDirective>
              {tags.map((tag, index) => (
                <ChipDirective
                  key={index}
                  text={getFirstWord(tag)}
                  cssClass={cn(
                    index === 1
                      ? "!bg-pink-50 !text-pink-500"
                      : "!bg-success-50 !text-success-700"
                  )}
                />
              ))}
            </ChipsDirective>
          </ChipListComponent>
          <button
            onClick={handleLike}
            className={`flex cursor-pointer items-center gap-1 px-3 py-0.5 rounded-full border transition-colors ${
              hasLiked
                ? "bg-white text-red-300 border-red-300"
                : "bg-white text-black border-black"
            }`}
            aria-label="Like trip"
          >
            <img
              src={`/assets/icons/${
                hasLiked ? "heart-filled.png" : "heart.png"
              }`}
              alt="like"
              className="w-4 h-4 object-contain"
            />
            <span className="text-sm">{likes}</span>
          </button>
        </div>

        <article className="tripCard-pill">{price}</article>
        <ToastComponent
          ref={toastRef}
          position={{ X: "Right", Y: "Bottom" }}
          timeOut={4000}
          showCloseButton={true}
        />
      </div>
    </>
  );
};

export default TripCard;
