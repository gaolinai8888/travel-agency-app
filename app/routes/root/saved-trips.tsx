import { redirect, useSearchParams } from "react-router";
import { account, appwriteConfig, database } from "~/appwrite/client";
import { getBookmarksByUserId } from "~/appwrite/bookmarks";
import { Header, TripCard } from "components";
import { parseTripData } from "~/lib/utils";
import { PagerComponent } from "@syncfusion/ej2-react-grids";
import { useState } from "react";

export const clientLoader = async () => {
  try {
    // Get current user
    const user = await account.get();
    if (!user.$id) return redirect("/sign-in");

    // Get bookmarks for user
    const bookmarks = await getBookmarksByUserId(user.$id);
    if (!bookmarks?.documents.length) {
      return { trips: [] };
    }

    // Extract trip IDs from bookmarks
    const tripIds = bookmarks.documents.map((b) => b.tripId);

    // Fetch trips one by one (Appwrite SDK might not support batch query by IDs)
    const trips = [];
    for (const tripId of tripIds) {
      try {
        const trip = await database.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.tripCollectionId,
          tripId
        );
        trips.push(trip);
      } catch (err) {
        console.warn(`Trip with ID ${tripId} not found or error:`, err);
      }
    }

    return { trips };
  } catch (err) {
    console.error("Error in clientLoader:", err);
    return redirect("/sign-in");
  }
};

const SavedTrips = ({ loaderData }: { loaderData: { trips: any[] } }) => {
  const trips = loaderData?.trips ?? [];
  const tripsData = trips.map(({ $id, tripDetail, imageUrls }) => ({
    id: $id,
    ...parseTripData(tripDetail),
    imageUrls: imageUrls ?? [],
  }));

  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page") || "1");

  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.location.search = `?page=${page}`;
  };

  return (
    <main className="travel-detail pt-40 wrapper">
      <section className="flex flex-col gap-6">
        <Header
          title="Saved Trips"
          description="Your favorite journeys, all in one place."
        />

        {trips.length === 0 ? (
          <p>No saved trips found.</p>
        ) : (
          <div className="trip-grid">
            {tripsData.map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                name={trip.name!}
                imageUrl={trip.imageUrls?.[0] ?? ""}
                location={trip.itinerary?.[0]?.location ?? ""}
                tags={[trip.interests!, trip.travelStyle!]}
                price={trip.estimatedPrice!}
                hasRemoveButton={false}
                hasBookmarkButton={true}
              />
            ))}
          </div>
        )}
      </section>

      <PagerComponent
        totalRecordsCount={trips.length}
        pageSize={8}
        currentPage={currentPage}
        click={(args) => handlePageChange(args.currentPage)}
        cssClass="custom-pager !mb-4"
      />
    </main>
  );
};

export default SavedTrips;
