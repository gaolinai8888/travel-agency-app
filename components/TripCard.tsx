import { Link, useLocation, useNavigate } from "react-router";
import { cn, getFirstWord } from "~/lib/utils";
import {
  ChipDirective,
  ChipListComponent,
  ChipsDirective,
} from "@syncfusion/ej2-react-buttons";
import { useState } from "react";
import { appwriteConfig, database } from "~/appwrite/client";

const TripCard = ({
  id,
  name,
  location,
  imageUrl,
  tags,
  price,
  hasRemoveButton,
}: TripCardProps) => {
  const path = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
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

  return (
    <>
      {/* Full page overlay and spinner during loading */}
      {loading && (
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
            className={`absolute top-2 left-2 z-10 rounded-full ${
              loading ? "bg-gray-300" : "bg-red-100"
            } text-white w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-700 cursor-pointer`}
            aria-label="Remove trip"
            title="Remove trip"
            type="button"
          >
            X
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
