import { ComboBoxComponent } from "@syncfusion/ej2-react-dropdowns";
import { Header } from "components";
import type { Route } from "./+types/create-trip";
import { comboBoxItems, selectItems } from "~/constants";
import { cn, formatKey, parseTripData } from "~/lib/utils";
import {
  LayerDirective,
  LayersDirective,
  MapsComponent,
} from "@syncfusion/ej2-react-maps";
import { useRef, useState } from "react";
import { world_map } from "~/constants/world_map";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
import { account } from "~/appwrite/client";
import { useLocation, useNavigate } from "react-router";
import type { ToastComponent } from "@syncfusion/ej2-react-notifications";

// get all countries
export const loader = async () => {
  const response = await fetch(
    "https://restcountries.com/v3.1/all?fields=flag,name,latlng,maps,flags"
  );
  const data = await response.json();
  return data.map((country: any) => ({
    name: country.name.common,
    coordinates: country.latlng,
    value: country.name.common,
    openStreetMap: country.maps?.openStreetMap,
    flagUrl: country.flags.svg,
  }));
};

const CreateTrip = ({ loaderData }: Route.ComponentProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const countries = loaderData as (Country & { flagUrl: string })[];

  const existingTrip = location.state?.trip || null;

  const existingTripData = parseTripData(existingTrip?.tripDetail || "");

  const [formData, setFormData] = useState<TripFormData>({
    country: existingTripData?.country || "",
    travelStyle: existingTripData?.travelStyle || "",
    interest: existingTripData?.interests || "",
    budget: existingTripData?.budget || "",
    duration: existingTripData?.duration || 0,
    groupType: existingTripData?.groupType || "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const countryData = countries.map((country) => ({
    text: country.name,
    value: country.value,
    flagUrl: country.flagUrl,
  }));

  const mapData = [
    {
      country: formData.country,
      color: "#EA382E",
      coordinates:
        countries.find((c: Country) => c.name === formData.country)
          ?.coordinates || [],
    },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const apiUrl = existingTrip ? "/api/update-trip" : "/api/create-trip";

    if (
      !formData.country ||
      !formData.travelStyle ||
      !formData.interest ||
      !formData.budget ||
      !formData.groupType
    ) {
      setError("Please provide values for all fields");
      setLoading(false);
      return;
    }

    if (formData.duration < 1 || formData.duration > 10) {
      setError("Duration must be between 1 and 10 days");
      setLoading(false);
      return;
    }

    const user = await account.get();
    if (!user.$id) {
      console.error("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          existingTrip
            ? {
                tripId: existingTrip.$id,
                country: formData.country,
                numberOfDays: formData.duration,
                travelStyle: formData.travelStyle,
                interests: formData.interest,
                budget: formData.budget,
                groupType: formData.groupType,
                userId: user.$id,
              }
            : {
                country: formData.country,
                numberOfDays: formData.duration,
                travelStyle: formData.travelStyle,
                interests: formData.interest,
                budget: formData.budget,
                groupType: formData.groupType,
                userId: user.$id,
              }
        ),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const result: CreateTripResponse = await response.json();

      if (result?.id) {
        showToast("Success", "A new trip has been created!", "e-toast-success");
        navigate(`/trips/${result.id}`);
      } else {
        console.log("Failed to generate a trip");
        showToast(
          "Error",
          "An error has occurred while creating the trip.",
          "e-toast-danger"
        );
      }
    } catch (e) {
      console.error("Error generating trip", e);
      showToast(
        "Error",
        "An error has occurred while creating the trip.",
        "e-toast-danger"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof TripFormData, value: string | number) => {
    setFormData({ ...formData, [key]: value });
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
    <main className="flex flex-col gap-10 pb-20 wrapper">
      <Header
        title={existingTrip ? "Edit Trip" : "Add a New Trip"}
        description="View and edit AI Generated travel plans"
      />

      <section className="mt-2.5 wrapper-md">
        <form className="trip-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="country">Country</label>
            <ComboBoxComponent
              id="country"
              dataSource={countryData}
              fields={{ text: "text", value: "value" }}
              placeholder="Select a Country"
              className="combo-box"
              value={formData.country}
              itemTemplate={(data: any) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: 0,
                    margin: 0,
                  }}
                >
                  <img
                    src={data.flagUrl}
                    alt={data.text}
                    style={{ width: 20, marginRight: 8 }}
                  />
                  {data.text}
                </span>
              )}
              valueTemplate={(data: any) => (
                <span style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={data.flagUrl}
                    alt={data.text}
                    style={{ width: 20, marginRight: 8 }}
                  />
                  {data.text}
                </span>
              )}
              change={(e: { value: string | undefined }) => {
                if (e.value) {
                  handleChange("country", e.value);
                }
              }}
              allowFiltering
              filtering={(e) => {
                const query = e.text.toLowerCase();
                e.updateData(
                  countries
                    .filter((country) =>
                      country.name.toLowerCase().includes(query)
                    )
                    .map((country) => ({
                      text: country.name,
                      value: country.value,
                      flagUrl: country.flagUrl,
                    }))
                );
              }}
            />
          </div>

          <div>
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              name="duration"
              placeholder="Enter a number of days"
              className="form-input placeholder:text-gray-100"
              value={formData.duration}
              onChange={(e) => handleChange("duration", Number(e.target.value))}
            />
          </div>

          {selectItems.map((key) => (
            <div key={key}>
              <label htmlFor={key}>{formatKey(key)}</label>

              <ComboBoxComponent
                id={key}
                dataSource={comboBoxItems[key].map((item) => ({
                  text: item,
                  value: item,
                }))}
                fields={{ text: "text", value: "value" }}
                placeholder={`Select ${formatKey(key)}`}
                value={formData[key] as string}
                change={(e: { value: string | undefined }) => {
                  if (e.value) {
                    handleChange(key, e.value);
                  }
                }}
                allowFiltering
                filtering={(e) => {
                  const query = e.text.toLowerCase();
                  e.updateData(
                    comboBoxItems[key]
                      .filter((item) => item.toLowerCase().includes(query))
                      .map((item) => ({
                        text: item,
                        value: item,
                      }))
                  );
                }}
                className="combo-box"
              />
            </div>
          ))}

          <div>
            <label htmlFor="location">Location on the world map</label>
            <MapsComponent>
              <LayersDirective>
                <LayerDirective
                  dataSource={mapData}
                  shapeData={world_map}
                  shapePropertyPath="name"
                  shapeDataPath="country"
                  shapeSettings={{ colorValuePath: "color", fill: "#E5E5E5" }}
                />
              </LayersDirective>
            </MapsComponent>
          </div>

          <div className="bg-gray-200 h-px w-full" />

          {error && (
            <div className="error">
              <p>{error}</p>
            </div>
          )}

          <footer className="px-6 w-full">
            <ButtonComponent
              type="submit"
              className="button-class !h-12 !w-full"
              disabled={loading}
            >
              <img
                src={`/assets/icons/${
                  loading ? "loader.svg" : "magic-star.svg"
                }`}
                className={cn("size-5", { "animate-spin": loading })}
              />
              <span className="p-16-semibold text-white">
                {loading
                  ? existingTrip
                    ? "Updating..."
                    : "Generating..."
                  : existingTrip
                  ? "Update Trip"
                  : "Generate Trip"}
              </span>
            </ButtonComponent>
          </footer>
        </form>
      </section>
    </main>
  );
};

export default CreateTrip;
