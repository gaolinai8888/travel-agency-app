import { GoogleGenerativeAI } from "@google/generative-ai";
import { ID } from "appwrite";
import { data, type ActionFunctionArgs } from "react-router";
import { appwriteConfig, database } from "~/appwrite/client";
import { createProduct } from "~/lib/stripe";
import { parseMarkdownToJson, parseTripData } from "~/lib/utils";

export const action = async ({ request }: ActionFunctionArgs) => {
  const {
    country,
    numberOfDays,
    travelStyle,
    interests,
    budget,
    groupType,
    userId,
  } = await request.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY!;

  try {
    const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
Budget: '${budget}'
Interests: '${interests}'
TravelStyle: '${travelStyle}'
GroupType: '${groupType}'

Write each activity in a professional travel agency itinerary style — clear, polished, and enticing, like what clients receive from a premium tour operator.  
For each day:
- Include at least 4~6 well-planned activities.
- Each activity must state: what visitors will see/do, what makes it special, how long they should plan to spend there, and the best way to get there from the previous stop (with estimated travel time).
- Use vivid but concise language, describing key highlights and atmosphere.
- Keep the Night activity as the final entry for each day, and also include in its description a recommendation for a nearby place to stay (hotel name or type) close to the last activity.
- Ensure logical flow between activities to minimize backtracking.

Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
{
  "name": "A descriptive title for the trip",
  "description": "A brief description of the trip and its highlights not exceeding 100 words",
  "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
  "duration": ${numberOfDays},
  "budget": "${budget}",
  "travelStyle": "${travelStyle}",
  "country": "${country}",
  "interests": ${interests},
  "groupType": "${groupType}",
  "bestTimeToVisit": [
    "🌸 Season (from month to month): reason to visit",
    "☀️ Season (from month to month): reason to visit",
    "🍁 Season (from month to month): reason to visit",
    "❄️ Season (from month to month): reason to visit"
  ],
  "weatherInfo": [
    "☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)",
    "❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)"
  ],
  "location": {
    "city": "name of the city or region",
    "coordinates": [latitude, longitude],
    "openStreetMap": "link to open street map"
  },
  "itinerary": [
    {
      "day": 1,
      "location": "City/Region Name",
      "activities": [
        {
          "time": "Morning",
          "description": "🏰 Guided tour of the 12th-century Old Town Castle — admire its fortified walls, regal chambers, and breathtaking tower views. Learn about centuries of royal intrigue and the battles that shaped the city. Plan to spend about 1.5 hours here. Arrive on foot from your hotel in 10 minutes along charming cobblestone streets."
        },
        {
          "time": "Late Morning",
          "description": "☕ Relax at the historic Café du Square, a century-old coffee house with marble-topped tables and stained-glass windows. Enjoy a cappuccino and a buttery local pastry. Spend 45 minutes here before walking 5 minutes to the next site."
        },
        {
          "time": "Afternoon",
          "description": "🖼️ Explore the Grand Art Museum — a curated journey from Renaissance masterpieces to modernist sculptures. Your guided visit will highlight rare works and their fascinating backstories. Allocate 2 hours. Travel by metro from the café in 15 minutes."
        },
        {
          "time": "Mid-Afternoon",
          "description": "🛍️ Discover the Central Market, bustling with artisanal crafts, spice stalls, and local delicacies. Sample handmade chocolates or pick up a handwoven souvenir. Plan for about 1 hour here. Located just a 10-minute walk from the museum."
        },
        {
          "time": "Evening",
          "description": "🍷 Gourmet dinner at Skyview Terrace — savor grilled sea bass or tender lamb paired with local wines, all while enjoying live jazz against the city skyline. Allow 2 hours. A 10-minute taxi ride from the market."
        },
        {
          "time": "Night",
          "description": "🌃 Optional guided night tour of the illuminated Old Town, weaving through narrow lanes and hidden courtyards as stories of the city’s past come to life. Allocate 1 hour. Walk 5 minutes from the restaurant. Recommended nearby stay: The Grand Heritage Hotel, a 4-star boutique property offering elegant rooms and a rooftop bar."
        }
      ]
    }
  ]
}`;

    const textResult = await genAI
      .getGenerativeModel({
        model: "gemini-2.0-flash",
      })
      .generateContent([prompt]);

    const trip = parseMarkdownToJson(textResult.response.text());

    const imageResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${country} ${interests} ${travelStyle}&client_id=${unsplashKey}`
    );

    const imageUrls = (await imageResponse.json()).results
      .slice(0, 3)
      .map((result: any) => result.urls?.regular || null);

    const result = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.tripCollectionId,
      ID.unique(),
      {
        tripDetail: JSON.stringify(trip),
        createdAt: new Date().toISOString(),
        imageUrls,
        userId,
      }
    );

    const tripDetail = parseTripData(result.tripDetail) as Trip;
    const tripPrice = parseInt(tripDetail.estimatedPrice.replace("$", ""), 10);
    const paymentLink = await createProduct(
      tripDetail.name,
      tripDetail.description,
      imageUrls,
      tripPrice,
      result.$id
    );

    await database.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.tripCollectionId,
      result.$id,
      {
        payment_link: paymentLink.url,
      }
    );

    return data({ id: result.$id });
  } catch (e) {
    console.error("Error generating travel plan: ", e);
  }
};
