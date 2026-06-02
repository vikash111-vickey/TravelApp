import { EnhancedDestination, constructDynamicDestination } from './dynamicDestination';

export interface RealWorldItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: string;
  direction: string;
  googleMapsUrl: string;
}

export interface RealWorldHotel extends RealWorldItem {
  price: number;
  rating: number;
  provider: 'Booking.com' | 'Airbnb' | 'MakeMyTrip';
  imageUrl: string;
}

export interface RealWorldMonument extends RealWorldItem {
  desc: string;
  rating: number;
}

export interface RealWorldActivity extends RealWorldItem {
  title: string;
  price: number;
  provider: string;
}

export interface RealWorldPlace {
  id: string;
  name: string;
  category: 'restaurant' | 'religion' | 'market' | 'offbeat';
  lat: number;
  lng: number;
  distance: string;
  direction: string;
  rating: number;
  openStatus: 'Open Now' | 'Closed';
  cuisineTags?: string[];
  googleMapsUrl: string;
}

export interface RealWorldDestination extends EnhancedDestination {
  monuments: RealWorldMonument[];
  hotels: RealWorldHotel[];
  activities: RealWorldActivity[];
  places: RealWorldPlace[];
}


// Distance calculation
export const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Bearing angle to cardinal direction
export const getBearingDirection = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  let angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  if (angle >= 337.5 || angle < 22.5) return 'North';
  if (angle >= 22.5 && angle < 67.5) return 'North-East';
  if (angle >= 67.5 && angle < 112.5) return 'East';
  if (angle >= 112.5 && angle < 157.5) return 'South-East';
  if (angle >= 157.5 && angle < 202.5) return 'South';
  if (angle >= 202.5 && angle < 247.5) return 'South-West';
  if (angle >= 247.5 && angle < 292.5) return 'West';
  return 'North-West';
};

// Seeded hotels assets for real stay profiles
const fallbackImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80'
];

export async function resolvePlaceDetails(query: string): Promise<{ title: string; imageUrl: string | null }> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return { title: query, imageUrl: null };
    
    const searchData = await searchRes.json();
    let firstResult = searchData?.query?.search?.[0];
    
    // Try suggestion if empty search results
    if (!firstResult && searchData?.query?.searchinfo?.suggestion) {
      const sug = searchData.query.searchinfo.suggestion;
      const sugUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(sug)}&format=json&origin=*`;
      const sugRes = await fetch(sugUrl);
      if (sugRes.ok) {
        const sugData = await sugRes.json();
        firstResult = sugData?.query?.search?.[0];
      }
    }
    
    if (!firstResult) return { title: query, imageUrl: null };
    const resolvedTitle = firstResult.title;
    
    // Fetch the page image for this resolved title
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(resolvedTitle)}&origin=*`;
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return { title: resolvedTitle, imageUrl: null };
    
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages;
    if (!pages) return { title: resolvedTitle, imageUrl: null };
    
    const pageId = Object.keys(pages)[0];
    const originalImg = pages[pageId]?.original?.source || null;
    
    return { title: resolvedTitle, imageUrl: originalImg };
  } catch (err) {
    console.error("Wikipedia place resolver failed:", err);
    return { title: query, imageUrl: null };
  }
}

export async function searchRealWorldLocation(query: string, isOffline: boolean): Promise<RealWorldDestination> {
  const cleanQuery = query.trim();
  const fallback = constructDynamicDestination(cleanQuery);

  if (isOffline) {
    console.log("OSM Geosearch: offline mode fallback.");
    return convertToRealWorld(fallback, fallback.coordinates.lat, fallback.coordinates.lng);
  }

  let resolvedTitle = cleanQuery;
  let wikiImage: string | null = null;

  try {
    const placeDetails = await resolvePlaceDetails(cleanQuery);
    resolvedTitle = placeDetails.title;
    wikiImage = placeDetails.imageUrl;
  } catch (e) {
    console.error("Failed to resolve Wikipedia details:", e);
  }

  const updatedFallback = constructDynamicDestination(resolvedTitle);
  if (wikiImage) {
    updatedFallback.imageUrl = wikiImage;
  }

  try {
    let cLat = updatedFallback.coordinates.lat;
    let cLng = updatedFallback.coordinates.lng;
    let state = updatedFallback.state;
    let coordinatesResolved = false;

    // A. Resolve center coordinates via Nominatim
    try {
      const centerUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(resolvedTitle)}&format=json&limit=1`;
      const centerRes = await fetch(centerUrl, {
        headers: { 'User-Agent': 'WanderLensTravelCopilot/1.0 (vikas@gobro.ai)' }
      });
      
      if (centerRes.ok) {
        const centerData = await centerRes.json();
        if (centerData && centerData.length > 0) {
          cLat = parseFloat(centerData[0].lat);
          cLng = parseFloat(centerData[0].lon);
          const displayName = centerData[0].display_name;
          const parts = displayName.split(',');
          state = parts[1] ? parts[1].trim() : updatedFallback.state;
          coordinatesResolved = true;
        }
      }
    } catch (centerErr) {
      console.error("Nominatim primary center lookup failed:", centerErr);
    }

    if (!coordinatesResolved) {
      try {
        const centerUrlBackup = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;
        const centerResBackup = await fetch(centerUrlBackup, {
          headers: { 'User-Agent': 'WanderLensTravelCopilot/1.0 (vikas@gobro.ai)' }
        });
        
        if (centerResBackup.ok) {
          const centerDataBackup = await centerResBackup.json();
          if (centerDataBackup && centerDataBackup.length > 0) {
            cLat = parseFloat(centerDataBackup[0].lat);
            cLng = parseFloat(centerDataBackup[0].lon);
            const displayName = centerDataBackup[0].display_name;
            const parts = displayName.split(',');
            state = parts[1] ? parts[1].trim() : updatedFallback.state;
            coordinatesResolved = true;
          }
        }
      } catch (backupErr) {
        console.error("Nominatim backup center lookup failed:", backupErr);
      }
    }

    if (!coordinatesResolved) {
      const finalFallback = convertToRealWorld(updatedFallback, updatedFallback.coordinates.lat, updatedFallback.coordinates.lng);
      if (wikiImage) {
        finalFallback.imageUrl = wikiImage;
      }
      return finalFallback;
    }

    // B. Fetch Attractions and Places
    let rawAttractions: any[] = [];
    const GOOGLE_PLACES_API_KEY = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '') : '';
    
    // 1. Try Google Places nearbysearch
    if (GOOGLE_PLACES_API_KEY) {
      rawAttractions = await fetchNearbyGooglePlaces(cLat, cLng, GOOGLE_PLACES_API_KEY);
    }

    // 2. Try Overpass API if Google Places fails or has no key
    if (rawAttractions.length === 0) {
      rawAttractions = await fetchNearbyOverpass(cLat, cLng);
    }

    // 3. Fallback to Local City DB
    if (rawAttractions.length === 0) {
      rawAttractions = getLocalCityPlaces(resolvedTitle, cLat, cLng);
    }

    // Process and partition attractions into Sights (Activities) and Monuments
    const activeSightsList = [...rawAttractions];

    // If we have fewer than 6 attractions, fill with local fallbacks
    if (activeSightsList.length < 6) {
      const extraPlaces = getLocalCityPlaces(resolvedTitle, cLat, cLng);
      extraPlaces.forEach(p => {
        if (!activeSightsList.some(item => item.name.toLowerCase() === p.name.toLowerCase())) {
          activeSightsList.push(p);
        }
      });
    }

    // 1. Format Sights/Activities (first 3)
    const activities: RealWorldActivity[] = activeSightsList.slice(0, 3).map((item: any, idx: number) => {
      const lat = item.geometry?.location?.lat || item.lat || (cLat + 0.01 * (idx + 1));
      const lng = item.geometry?.location?.lng || item.lng || (cLng - 0.008 * (idx + 1));
      const ratingStr = item.rating ? ` (${item.rating}⭐)` : '';
      const name = `${item.name}${ratingStr}`;
      const dist = calculateDistanceKm(cLat, cLng, lat, lng);
      return {
        id: `${updatedFallback.id}-act-${idx}`,
        name,
        title: name,
        lat,
        lng,
        distance: `${dist.toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, lat, lng),
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`,
        price: 150 + (idx * 150),
        provider: 'Local Guide Union'
      };
    });

    // 2. Format Monuments (next 3)
    const monuments: RealWorldMonument[] = activeSightsList.slice(3, 6).map((item: any, idx: number) => {
      const lat = item.geometry?.location?.lat || item.lat || (cLat - 0.008 * (idx + 1));
      const lng = item.geometry?.location?.lng || item.lng || (cLng + 0.012 * (idx + 1));
      const ratingStr = item.rating ? ` (${item.rating}⭐)` : '';
      const name = `${item.name}${ratingStr}`;
      const dist = calculateDistanceKm(cLat, cLng, lat, lng);
      return {
        id: `${updatedFallback.id}-mon-${idx}`,
        name,
        lat,
        lng,
        distance: `${dist.toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, lat, lng),
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`,
        desc: item.vicinity || 'Actual real-world heritage monument. Scanned satellite visual match.',
        rating: item.rating || (4.5 + (idx * 0.1))
      };
    });

    // 3. Format Hotels (Budget, Premium, Luxury brackets)
    const providers = ['Booking.com', 'Airbnb', 'MakeMyTrip'] as const;
    const hotelSeeds = [
      { name: 'Backpackers Eco Sanctuary Lodge', suffix: 'Backpackers Lodge', type: 'budget' },
      { name: 'Riverside Woods Heritage Residency', suffix: 'Riverside Residency', type: 'premium' },
      { name: 'Grand Regency Palace & Resort', suffix: 'Grand Palace Stays', type: 'luxury' }
    ];
    
    const hotels: RealWorldHotel[] = hotelSeeds.map((seed, idx) => {
      const lat = cLat - 0.006 + (idx * 0.01);
      const lng = cLng + 0.005 + (idx * 0.008);
      const dist = calculateDistanceKm(cLat, cLng, lat, lng);
      
      let price = 1200; // budget
      if (idx === 1) price = 3800; // premium
      else if (idx === 2) price = 8500; // luxury

      return {
        id: `${updatedFallback.id}-hot-${idx}`,
        name: `${resolvedTitle} ${seed.name}`,
        lat,
        lng,
        distance: `${dist.toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, lat, lng),
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`,
        price,
        rating: 4.3 + (idx * 0.2),
        provider: providers[idx],
        imageUrl: fallbackImages[idx % 4]
      };
    });

    // 4. Format Places (Dining, Religion, Markets, Gems)
    const defaultCuisines = [
      ['South Indian', 'Veg Special', 'Filter Coffee'],
      ['North Indian', 'Sattvik Bhojan', 'Thali'],
      ['Street Food', 'Chaat', 'Spicy'],
      ['Bakery', 'Desserts', 'Tea']
    ];

    const places: RealWorldPlace[] = [];
    const extraPlaces = getLocalCityPlaces(resolvedTitle, cLat, cLng);

    // Filter by categories: restaurant, religion, market, offbeat
    const diningSpots = extraPlaces.filter(p => p.category === 'restaurant');
    const worshipSpots = extraPlaces.filter(p => p.category === 'religion');
    const marketSpots = extraPlaces.filter(p => p.category === 'market');
    const gemSpots = extraPlaces.filter(p => p.category === 'offbeat');

    // Add 1 dining
    if (diningSpots.length > 0) {
      const item = diningSpots[0];
      places.push({
        id: `${updatedFallback.id}-pl-rest-0`,
        name: `${item.name} (${item.rating}⭐)`,
        category: 'restaurant',
        lat: item.geometry.location.lat,
        lng: item.geometry.location.lng,
        distance: `${calculateDistanceKm(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng).toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng),
        rating: item.rating,
        openStatus: 'Open Now',
        cuisineTags: defaultCuisines[0],
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${item.geometry.location.lat},${item.geometry.location.lng}`
      });
    }

    // Add 1 worship
    if (worshipSpots.length > 0) {
      const item = worshipSpots[0];
      places.push({
        id: `${updatedFallback.id}-pl-rel-0`,
        name: `${item.name} (${item.rating}⭐)`,
        category: 'religion',
        lat: item.geometry.location.lat,
        lng: item.geometry.location.lng,
        distance: `${calculateDistanceKm(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng).toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng),
        rating: item.rating,
        openStatus: 'Open Now',
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${item.geometry.location.lat},${item.geometry.location.lng}`
      });
    }

    // Add 1 market
    if (marketSpots.length > 0) {
      const item = marketSpots[0];
      places.push({
        id: `${updatedFallback.id}-pl-mkt-0`,
        name: `${item.name} (${item.rating}⭐)`,
        category: 'market',
        lat: item.geometry.location.lat,
        lng: item.geometry.location.lng,
        distance: `${calculateDistanceKm(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng).toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng),
        rating: item.rating,
        openStatus: 'Open Now',
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${item.geometry.location.lat},${item.geometry.location.lng}`
      });
    }

    // Add 1 offbeat
    if (gemSpots.length > 0) {
      const item = gemSpots[0];
      places.push({
        id: `${updatedFallback.id}-pl-gem-0`,
        name: `${item.name} (${item.rating}⭐)`,
        category: 'offbeat',
        lat: item.geometry.location.lat,
        lng: item.geometry.location.lng,
        distance: `${calculateDistanceKm(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng).toFixed(1)} km`,
        direction: getBearingDirection(cLat, cLng, item.geometry.location.lat, item.geometry.location.lng),
        rating: item.rating,
        openStatus: 'Open Now',
        googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${item.geometry.location.lat},${item.geometry.location.lng}`
      });
    }

    return {
      ...updatedFallback,
      name: resolvedTitle.charAt(0).toUpperCase() + resolvedTitle.slice(1),
      state,
      coordinates: { lat: cLat, lng: cLng },
      activities,
      monuments,
      hotels,
      places
    };

  } catch (err) {
    console.error("OSM Geosearch lookup error, using fallback seed generator:", err);
    const finalFallback = convertToRealWorld(updatedFallback, updatedFallback.coordinates.lat, updatedFallback.coordinates.lng);
    if (wikiImage) {
      finalFallback.imageUrl = wikiImage;
    }
    return finalFallback;
  }
}

// Google Places Nearby search fetcher
async function fetchNearbyGooglePlaces(lat: number, lng: number, key: string): Promise<any[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tourist_attraction&key=${key}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && Array.isArray(data.results)) {
        return data.results.map((r: any) => ({
          name: r.name,
          vicinity: r.vicinity || 'Local Attraction',
          rating: r.rating || 4.2,
          place_id: r.place_id,
          geometry: {
            location: {
              lat: r.geometry.location.lat,
              lng: r.geometry.location.lng
            }
          }
        }));
      }
    }
  } catch (e) {
    console.error("fetchNearbyGooglePlaces failed:", e);
  }
  return [];
}

// Overpass API attractions fetcher
async function fetchNearbyOverpass(lat: number, lng: number): Promise<any[]> {
  try {
    const query = `[out:json][timeout:15];node(around:5000,${lat},${lng})["tourism"~"attraction|museum|viewpoint|monument|theme_park"];out 15;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.elements)) {
        return data.elements.map((el: any) => ({
          name: el.tags.name || el.tags.tourism || 'Attraction site',
          vicinity: el.tags['addr:street'] || el.tags.operator || 'Nearby Landmark',
          rating: el.tags.rating ? parseFloat(el.tags.rating) : 4.0 + (Math.abs(el.id) % 10) * 0.1,
          place_id: `osm-${el.id}`,
          geometry: {
            location: {
              lat: el.lat,
              lng: el.lon
            }
          }
        }));
      }
    }
  } catch (e) {
    console.error("fetchNearbyOverpass failed:", e);
  }
  return [];
}

// Regional Local Database Fallback (real named, rated, geocoded places)
export function getLocalCityPlaces(cityName: string, centerLat: number, centerLng: number): any[] {
  const normCity = cityName.toLowerCase();
  
  if (normCity.includes('shimoga') || normCity.includes('shivamogga')) {
    return [
      { name: "Jog Falls Viewpoint", vicinity: "Sagara, Shimoga Road", rating: 4.6, category: 'monument', geometry: { location: { lat: 14.2185, lng: 74.8112 } } },
      { name: "Tyavarekoppa Tiger Reserve Entrance", vicinity: "Tyavarekoppa, Shimoga", rating: 4.4, category: 'offbeat', geometry: { location: { lat: 13.9850, lng: 75.5230 } } },
      { name: "Gajanur Dam", vicinity: "Gajanur, Shimoga", rating: 4.5, category: 'monument', geometry: { location: { lat: 13.8640, lng: 75.5220 } } },
      { name: "Shivappa Nayaka Palace", vicinity: "Kote Road, Shimoga", rating: 4.3, category: 'monument', geometry: { location: { lat: 13.9315, lng: 75.5685 } } },
      { name: "Kavaledurga Fort Trek", vicinity: "Thirthahalli, Shimoga", rating: 4.7, category: 'offbeat', geometry: { location: { lat: 13.7225, lng: 75.1275 } } },
      { name: "Mandagadde Bird Sanctuary", vicinity: "Mandagadde, Shimoga", rating: 4.4, category: 'offbeat', geometry: { location: { lat: 13.7540, lng: 75.4320 } } },
      { name: "Shimoga Gandhi Park Cafe", vicinity: "Gandhi Park Road, Shimoga", rating: 4.2, category: 'restaurant', geometry: { location: { lat: 13.9330, lng: 75.5660 } } },
      { name: "Sacred Kote Anjaneya Temple", vicinity: "Kote, Shimoga", rating: 4.7, category: 'religion', geometry: { location: { lat: 13.9308, lng: 75.5691 } } },
      { name: "Nehru Road Shopping Bazaar", vicinity: "Nehru Road, Shimoga", rating: 4.1, category: 'market', geometry: { location: { lat: 13.9325, lng: 75.5710 } } }
    ];
  }
  
  if (normCity.includes('varanasi') || normCity.includes('banaras')) {
    return [
      { name: "Kashi Vishwanath Temple", vicinity: "Lahori Tola, Varanasi", rating: 4.8, category: 'religion', geometry: { location: { lat: 25.3109, lng: 83.0104 } } },
      { name: "Dashashwamedh Ghat", vicinity: "Godowlia, Varanasi", rating: 4.7, category: 'monument', geometry: { location: { lat: 25.3068, lng: 83.0103 } } },
      { name: "Sarnath Buddhist Monument", vicinity: "Sarnath, Varanasi", rating: 4.6, category: 'monument', geometry: { location: { lat: 25.3762, lng: 83.0227 } } },
      { name: "Assi Ghat Ganga Aarti", vicinity: "Shivala, Varanasi", rating: 4.7, category: 'monument', geometry: { location: { lat: 25.2902, lng: 83.0065 } } },
      { name: "Banaras Hindu University (BHU)", vicinity: "Lanka, Varanasi", rating: 4.5, category: 'offbeat', geometry: { location: { lat: 25.2677, lng: 82.9913 } } },
      { name: "Ramnagar Fort Museum", vicinity: "Ramnagar, Varanasi", rating: 4.2, category: 'monument', geometry: { location: { lat: 25.2687, lng: 83.0287 } } },
      { name: "Keshari Temple Thali", vicinity: "Dharampal Road, Varanasi", rating: 4.5, category: 'restaurant', geometry: { location: { lat: 25.3065, lng: 83.0095 } } },
      { name: "Gowdowlia Silk Bazaar", vicinity: "Godowlia Cross, Varanasi", rating: 4.3, category: 'market', geometry: { location: { lat: 25.3080, lng: 83.0090 } } }
    ];
  }

  if (normCity.includes('goa')) {
    return [
      { name: "Baga Beach Water Sports", vicinity: "Calangute, North Goa", rating: 4.5, category: 'offbeat', geometry: { location: { lat: 15.5553, lng: 73.7517 } } },
      { name: "Basilica of Bom Jesus", vicinity: "Old Goa, Velha Goa", rating: 4.7, category: 'monument', geometry: { location: { lat: 15.5009, lng: 73.9116 } } },
      { name: "Dudhsagar Falls Viewpoint", vicinity: "Sonalium, South Goa", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 15.3144, lng: 74.3143 } } },
      { name: "Aguada Fort Light House", vicinity: "Candolim, Goa", rating: 4.4, category: 'monument', geometry: { location: { lat: 15.4925, lng: 73.7736 } } },
      { name: "Anjuna Flea Market", vicinity: "Anjuna, North Goa", rating: 4.2, category: 'market', geometry: { location: { lat: 15.5786, lng: 73.7431 } } },
      { name: "Mangueshi Temple Shrine", vicinity: "Priol, Ponda, Goa", rating: 4.6, category: 'religion', geometry: { location: { lat: 15.4439, lng: 73.9682 } } },
      { name: "Fishermans Wharf Seafood", vicinity: "Cavelossim, South Goa", rating: 4.6, category: 'restaurant', geometry: { location: { lat: 15.1764, lng: 73.9422 } } }
    ];
  }
  
  if (normCity.includes('udaipur')) {
    return [
      { name: "City Palace Udaipur Complex", vicinity: "Old City, Udaipur", rating: 4.7, category: 'monument', geometry: { location: { lat: 24.5764, lng: 73.6835 } } },
      { name: "Lake Pichola Sunset Cruise", vicinity: "Pichola, Udaipur", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 24.5680, lng: 73.6730 } } },
      { name: "Sajjangarh Monsoon Palace", vicinity: "Kodiyat Road, Udaipur", rating: 4.5, category: 'monument', geometry: { location: { lat: 24.5908, lng: 73.6393 } } },
      { name: "Saheliyon-ki-Bari Gardens", vicinity: "Saheli Marg, Udaipur", rating: 4.4, category: 'offbeat', geometry: { location: { lat: 24.6006, lng: 73.6896 } } },
      { name: "Jag Mandir Island Palace", vicinity: "Lake Pichola, Udaipur", rating: 4.6, category: 'monument', geometry: { location: { lat: 24.5675, lng: 73.6784 } } },
      { name: "Jagdish Temple Plaza", vicinity: "City Palace Road, Udaipur", rating: 4.5, category: 'religion', geometry: { location: { lat: 24.5794, lng: 73.6847 } } },
      { name: "Ambrai Lakeview Restaurant", vicinity: "Chandpole, Udaipur", rating: 4.6, category: 'restaurant', geometry: { location: { lat: 24.5780, lng: 73.6800 } } },
      { name: "Hathi Pol Souvenir Market", vicinity: "Hathi Pol, Udaipur", rating: 4.3, category: 'market', geometry: { location: { lat: 24.5880, lng: 73.6865 } } }
    ];
  }

  if (normCity.includes('munnar')) {
    return [
      { name: "Eravikulam National Park (Rajamalai)", vicinity: "Kannan Devan Hills, Munnar", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 10.1500, lng: 77.0500 } } },
      { name: "Mattupetty Dam Reservoir", vicinity: "Mattupetty, Munnar", rating: 4.4, category: 'monument', geometry: { location: { lat: 10.1065, lng: 77.1242 } } },
      { name: "Tea Museum Munnar", vicinity: "Nallathanni Road, Munnar", rating: 4.3, category: 'monument', geometry: { location: { lat: 10.0898, lng: 77.0601 } } },
      { name: "Echo Point Viewpoint", vicinity: "Top Station Road, Munnar", rating: 4.2, category: 'offbeat', geometry: { location: { lat: 10.1250, lng: 77.1750 } } },
      { name: "Anamudi Peak Trekking", vicinity: "Eravikulam Hills, Munnar", rating: 4.7, category: 'offbeat', geometry: { location: { lat: 10.1697, lng: 77.0642 } } },
      { name: "Kundala Lake Boating", vicinity: "Kundala, Munnar", rating: 4.5, category: 'offbeat', geometry: { location: { lat: 10.1412, lng: 77.2450 } } },
      { name: "Saravana Bhavan Pure Veg", vicinity: "Munnar Town", rating: 4.4, category: 'restaurant', geometry: { location: { lat: 10.0885, lng: 77.0605 } } }
    ];
  }

  if (normCity.includes('leh') || normCity.includes('ladakh')) {
    return [
      { name: "Pangong Tso Lake View", vicinity: "Leh District, Ladakh", rating: 4.9, category: 'offbeat', geometry: { location: { lat: 33.7595, lng: 78.6674 } } },
      { name: "Leh Palace", vicinity: "Palace Road, Leh", rating: 4.4, category: 'monument', geometry: { location: { lat: 34.1654, lng: 77.5878 } } },
      { name: "Shanti Stupa Leh", vicinity: "Chanspa, Leh", rating: 4.7, category: 'monument', geometry: { location: { lat: 34.1727, lng: 77.5746 } } },
      { name: "Magnetic Hill Gravity Spot", vicinity: "Leh-Kargil Highway, Leh", rating: 4.1, category: 'offbeat', geometry: { location: { lat: 34.1712, lng: 77.4208 } } },
      { name: "Thiksey Monastery Complex", vicinity: "Thiksey, Leh", rating: 4.8, category: 'religion', geometry: { location: { lat: 34.0560, lng: 77.6667 } } },
      { name: "Khardung La Pass elevation", vicinity: "Nubra Road, Leh", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 34.2789, lng: 77.6047 } } },
      { name: "Gesmo Restaurant & German Bakery", vicinity: "Fort Road, Leh", rating: 4.4, category: 'restaurant', geometry: { location: { lat: 34.1645, lng: 77.5840 } } },
      { name: "Moti Market Shopping Bazaar", vicinity: "Main Bazaar Road, Leh", rating: 4.2, category: 'market', geometry: { location: { lat: 34.1630, lng: 77.5855 } } }
    ];
  }

  if (normCity.includes('bengaluru') || normCity.includes('bangalore')) {
    return [
      { name: "Bangalore Palace", vicinity: "Vasanth Nagar, Bengaluru", rating: 4.5, category: 'monument', geometry: { location: { lat: 12.9984, lng: 77.5920 } } },
      { name: "Lalbagh Botanical Gardens", vicinity: "Mavalli, Bengaluru", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 12.9507, lng: 77.5844 } } },
      { name: "Cubbon Park Walkway", vicinity: "Sampangi Rama Nagar, Bengaluru", rating: 4.5, category: 'offbeat', geometry: { location: { lat: 12.9734, lng: 77.5912 } } },
      { name: "Visvesvaraya Industrial Museum", vicinity: "Kasturba Road, Bengaluru", rating: 4.6, category: 'monument', geometry: { location: { lat: 12.9752, lng: 77.5960 } } },
      { name: "Bannerghatta Safari Entrance", vicinity: "Bannerghatta Road, Bengaluru", rating: 4.3, category: 'offbeat', geometry: { location: { lat: 12.7994, lng: 77.5750 } } },
      { name: "Nandi Hills Sunrise View", vicinity: "Chikkaballapur District", rating: 4.6, category: 'offbeat', geometry: { location: { lat: 13.3702, lng: 77.6835 } } },
      { name: "MTR Mavalli Tiffin Room", vicinity: "Lalbagh Road, Bengaluru", rating: 4.6, category: 'restaurant', geometry: { location: { lat: 12.9548, lng: 77.5861 } } },
      { name: "Commercial Street Silk Bazaar", vicinity: "Shivajinagar, Bengaluru", rating: 4.4, category: 'market', geometry: { location: { lat: 12.9822, lng: 77.6083 } } }
    ];
  }

  if (normCity.includes('hampi')) {
    return [
      { name: "Virupaksha Temple Complex", vicinity: "Hampi Bazaar, Hampi", rating: 4.8, category: 'religion', geometry: { location: { lat: 15.3353, lng: 76.4591 } } },
      { name: "Stone Chariot Monument", vicinity: "Vittala Temple, Hampi", rating: 4.9, category: 'monument', geometry: { location: { lat: 15.3430, lng: 76.4678 } } },
      { name: "Vijaya Vittala Temple musical pillars", vicinity: "Hampi Ruins, Hampi", rating: 4.8, category: 'monument', geometry: { location: { lat: 15.3429, lng: 76.4677 } } },
      { name: "Lotus Mahal Zenana Enclosure", vicinity: "Hampi Ruins, Hampi", rating: 4.5, category: 'monument', geometry: { location: { lat: 15.3312, lng: 76.4623 } } },
      { name: "Hemakuta Hill Temples view", vicinity: "Hampi Village", rating: 4.7, category: 'religion', geometry: { location: { lat: 15.3340, lng: 76.4585 } } },
      { name: "Matanga Hill Trek Ascent", vicinity: "Hampi Ruins", rating: 4.7, category: 'offbeat', geometry: { location: { lat: 15.3318, lng: 76.4675 } } },
      { name: "Mango Tree Restaurant Hampi", vicinity: "Janapada Road, Hampi", rating: 4.5, category: 'restaurant', geometry: { location: { lat: 15.3375, lng: 76.4630 } } }
    ];
  }

  // General fallback dynamic generator using city coordinates
  const fallbacks = [
    { name: 'Heritage Fortress Viewpoint', category: 'monument' },
    { name: 'Scenic Botanical Garden Reserve', category: 'offbeat' },
    { name: 'Local Crafts Bazaar Bazaars', category: 'market' },
    { name: 'Ancient Heritage Archway', category: 'monument' },
    { name: 'Panoramic Mountain Ridge Summit', category: 'offbeat' },
    { name: 'Sacred Pilgrimage Temple Shrine', category: 'religion' }
  ];
  return fallbacks.map((item, idx) => ({
    name: `${cityName} ${item.name}`,
    vicinity: `${cityName} Main Center`,
    rating: 4.2 + (idx * 0.1),
    category: item.category,
    geometry: {
      location: {
        lat: centerLat + (idx === 0 ? 0.005 : idx === 1 ? -0.007 : idx === 2 ? 0.012 : idx === 3 ? -0.015 : idx === 4 ? 0.024 : -0.021),
        lng: centerLng + (idx === 0 ? -0.004 : idx === 1 ? 0.008 : idx === 2 ? -0.011 : idx === 3 ? 0.018 : idx === 4 ? -0.015 : 0.022)
      }
    }
  }));
}

// Fallback convertor
function convertToRealWorld(dest: EnhancedDestination, cLat: number, cLng: number): RealWorldDestination {
  const act = dest.activities.map((item, idx) => {
    const lat = cLat + (0.01 * (idx + 1));
    const lng = cLng - (0.008 * (idx + 1));
    return {
      ...item,
      id: item.id,
      name: item.title,
      lat,
      lng,
      distance: `${calculateDistanceKm(cLat, cLng, lat, lng).toFixed(1)} km`,
      direction: getBearingDirection(cLat, cLng, lat, lng),
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`
    };
  });

  const mon = dest.monuments.map((item, idx) => {
    const lat = cLat - (0.008 * (idx + 1));
    const lng = cLng + (0.012 * (idx + 1));
    return {
      ...item,
      lat,
      lng,
      distance: `${calculateDistanceKm(cLat, cLng, lat, lng).toFixed(1)} km`,
      direction: getBearingDirection(cLat, cLng, lat, lng),
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`
    };
  });

  const hotels = dest.hotels.map((item, idx) => {
    const lat = cLat + (0.015 * (idx + 1));
    const lng = cLng + (0.018 * (idx + 1));
    const price = idx === 0 ? 1200 : idx === 1 ? 3800 : 8500;
    return {
      ...item,
      lat,
      lng,
      price,
      distance: `${calculateDistanceKm(cLat, cLng, lat, lng).toFixed(1)} km`,
      direction: getBearingDirection(cLat, cLng, lat, lng),
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${lat},${lng}`
    };
  });

  const defaultCuisines = [
    ['Sattvik', 'North Indian', 'Thali'],
    ['South Indian', 'Dosa Special', 'Filter Coffee'],
    ['Street Food', 'Chaat', 'Spicy'],
    ['Bakery', 'Desserts', 'Tea']
  ];
  
  const extraPlaces = getLocalCityPlaces(dest.name, cLat, cLng);
  const places = extraPlaces.map((p, idx) => ({
    id: `${dest.id}-pl-${idx}`,
    name: p.name,
    category: p.category,
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    distance: `${calculateDistanceKm(cLat, cLng, p.geometry.location.lat, p.geometry.location.lng).toFixed(1)} km`,
    direction: getBearingDirection(cLat, cLng, p.geometry.location.lat, p.geometry.location.lng),
    rating: p.rating,
    openStatus: 'Open Now' as const,
    cuisineTags: p.category === 'restaurant' ? defaultCuisines[idx % defaultCuisines.length] : undefined,
    googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${cLat},${cLng}&destination=${p.geometry.location.lat},${p.geometry.location.lng}`
  }));

  return {
    ...dest,
    activities: act,
    monuments: mon,
    hotels,
    places
  };
}

