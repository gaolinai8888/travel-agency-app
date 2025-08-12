import { Link, redirect, useLocation, useNavigate } from "react-router";
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
  const [isSavingTrip, setIsSavingTrip] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error("Failed to delete document", err);
      setError(err.message || "Error deleting record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchBookmark() {
      try {
        const user = await account.get();
        const bookmarks = await getBookmarksByUserId(user.$id);
        const bookmark = bookmarks?.documents.find((b) => b.tripId === id);
        if (bookmark) {
          setIsBookmarked(true);
          setBookmarkId(bookmark.$id);
        }
      } catch {
        // User not logged in or no bookmark
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    }
    fetchBookmark();
  }, [id]);

  const handleBookmark = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSavingTrip(true);
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
      } else if (bookmarkId) {
        await removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    } catch (err: any) {
      setError(err.message || "Error updating bookmark");
    } finally {
      setIsSavingTrip(false);
    }
  };
  return (
    <>
      {/* Full page overlay and spinner during loading */}
      {(loading || isSavingTrip) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-50 pointer-events-auto">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <Link
        to={
          path.pathname === "/" || path.pathname.startsWith("/travel")
            ? `/travel/${id}`
            : `/trips/${id}`
        }
        className={cn("trip-card", loading && "pointer-events-none")}
      >
        {hasRemoveButton && (
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`absolute top-7 left-4 z-10 rounded-full ${
              loading ? "bg-gray-300" : "bg-white"
            } text-black w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 cursor-pointer`}
            aria-label="Remove trip"
            title="Remove trip"
            type="button"
          >
            X
          </button>
        )}

        {hasBookmarkButton && (
          <button
            onClick={handleBookmark}
            disabled={isSavingTrip}
            className={`absolute top-6 left-4 z-10 rounded-full ${
              isSavingTrip ? "bg-gray-300" : "bg-transparent"
            } w-8 h-8 flex items-center justify-center hover:bg-red-700 cursor-pointer`}
            aria-label="Bookmark trip"
            title="Bookmark trip"
            type="button"
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
          <h2>{name}</h2>
          <figure>
            <img
              src="/assets/icons/location-mark.svg"
              alt="location"
              className="size-4"
            />
            <figcaption>{location}</figcaption>
          </figure>
        </article>

        <div className="mt-5 pl-[18px] pr-3.5 pb-5">
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
        </div>

        <article className="tripCard-pill">{price}</article>
      </Link>
    </>
  );
};

export default TripCard;
