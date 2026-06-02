// Mock data for GOBRO AI Travel Platform (WanderLens)

export interface Destination {
  id: string;
  name: string;
  state: string;
  description: string;
  imageUrl: string;
  archetypes: string[]; // e.g., 'spiritual', 'adventurer', 'luxury', 'value', 'eco'
  budgetTier: 'budget' | 'premium' | 'luxury';
  vegFriendly: boolean;
  sustainabilityScore: number; // Out of 100
  languages: string[];
  crowdLevel: 'low' | 'moderate' | 'high';
  temperature: string;
  pulseEvent: string;
  coordinates: { lat: number; lng: number };
  isInternational?: boolean;
  visaInfo?: string;
  currency?: string;
  exchangeRate?: string;
  activities: Array<{
    id: string;
    title: string;
    price: number;
    provider: string;
  }>;
  hotels: Array<{
    id: string;
    name: string;
    price: number;
    rating: number;
    provider: 'Booking.com' | 'Airbnb' | 'MakeMyTrip';
    imageUrl: string;
  }>;
  flights: Array<{
    id: string;
    airline: string;
    price: number;
    duration: string;
    provider: 'MakeMyTrip';
  }>;
  trains?: Array<{
    id: string;
    name: string;
    class: string;
    price: number;
    provider: 'IRCTC';
  }>;
}

export interface Archetype {
  id: string;
  name: string;
  description: string;
  bgGradient: string;
  badge: string;
  tagline: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  category: string;
  options: Array<{
    text: string;
    archetype: string;
    icon: string; // Lucide icon name
  }>;
}

export const ARCHETYPES: Record<string, Archetype> = {
  spiritual: {
    id: 'spiritual',
    name: 'Spiritual Seeker',
    description: 'You seek cultural roots, ancient temples, peaceful ashrams, and inner rejuvenation.',
    bgGradient: 'from-amber-600 to-red-700',
    badge: '🧘 Spiritual',
    tagline: 'Connect with ancient heritage and inner peace'
  },
  adventurer: {
    id: 'adventurer',
    name: 'High-Octane Adventurer',
    description: 'You seek mountain passes, trekking, river rafting, and adrenaline-fueled challenges.',
    bgGradient: 'from-red-600 to-black',
    badge: '🧗 Adventurer',
    tagline: 'Push boundaries and explore untamed trails'
  },
  luxury: {
    id: 'luxury',
    name: 'Heritage Royalty',
    description: 'You value grand architecture, palace hotels, personalized hospitality, and bespoke comfort.',
    bgGradient: 'from-red-800 to-yellow-600',
    badge: '👑 Royal/Luxury',
    tagline: 'Experience luxury inspired by timeless history'
  },
  value: {
    id: 'value',
    name: 'Value Voyager',
    description: 'You focus on authentic local life, budget-friendly homestays, and smart resource planning.',
    bgGradient: 'from-neutral-900 to-red-950',
    badge: '💰 Value Explorer',
    tagline: 'Maximize local experiences, optimize budgets'
  },
  eco: {
    id: 'eco',
    name: 'Eco Conscious Guardian',
    description: 'You prioritize carbon-neutral stays, organic farming, zero-plastic zones, and wildlife conservation.',
    bgGradient: 'from-green-800 to-red-900',
    badge: '🍃 Eco Guardian',
    tagline: 'Travel responsibly and leave only footprints'
  }
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What does your ideal morning look like while traveling?",
    category: "morning_vibe",
    options: [
      { text: "Attending a sunrise riverside ritual or meditation session", archetype: "spiritual", icon: "Sun" },
      { text: "Waking up in a tent ready to scale a high mountain pass", archetype: "adventurer", icon: "Compass" },
      { text: "Breakfast in bed at a heritage fort looking over a lake", archetype: "luxury", icon: "Coffee" },
      { text: "Grabbing hot local chai and street food with the locals", archetype: "value", icon: "MapPin" },
      { text: "Birdwatching or walking through a community organic forest", archetype: "eco", icon: "Leaf" }
    ]
  },
  {
    id: 2,
    question: "How do you prefer to travel between cities in India?",
    category: "transport",
    options: [
      { text: "Quiet train journeys with views of transitioning fields", archetype: "spiritual", icon: "Train" },
      { text: "Renting a rugged 4x4 or an adventure motorbike", archetype: "adventurer", icon: "Bike" },
      { text: "Private chauffeur-driven luxury SUV", archetype: "luxury", icon: "Car" },
      { text: "Sleeper class railways (IRCTC) or local budget buses", archetype: "value", icon: "Users" },
      { text: "Electric vehicle cabs or carbon-offset public services", archetype: "eco", icon: "Zap" }
    ]
  },
  {
    id: 3,
    question: "What is your dining preference when exploring new locations?",
    category: "dining",
    options: [
      { text: "Sattvik vegetarian thali prepared near ancient temple trusts", archetype: "spiritual", icon: "Sparkles" },
      { text: "High-protein local stews or trail rations in remote areas", archetype: "adventurer", icon: "Flame" },
      { text: "Bespoke fine-dining featuring traditional royal recipes", archetype: "luxury", icon: "ChefHat" },
      { text: "Authentic, high-turnover street food stalls and local mess rooms", archetype: "value", icon: "Utensils" },
      { text: "Farm-to-table organic cafes sourcing from local cooperatives", archetype: "eco", icon: "Grape" }
    ]
  },
  {
    id: 4,
    question: "What kind of keepsake do you want to bring back?",
    category: "keepsake",
    options: [
      { text: "Sandalwood incense, spiritual books, or sacred threads", archetype: "spiritual", icon: "Heart" },
      { text: "A physical piece of climbing gear or trail maps", archetype: "adventurer", icon: "Shield" },
      { text: "Hand-painted miniature art or real silk weaves", archetype: "luxury", icon: "Award" },
      { text: "Tons of photos, handwritten journals, and local stories", archetype: "value", icon: "Camera" },
      { text: "Handmade seed-paper notebooks or organic spices in cloth bags", archetype: "eco", icon: "Flower" }
    ]
  }
];

export const DESTINATIONS: Destination[] = [
  // Domestic Destinations
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    description: 'One of the oldest continuously inhabited cities in the world. Witness the soul-stirring Ganga Aarti, walk the narrow alleys (Galis), and experience profound spiritual transition at the river ghats.',
    imageUrl: 'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'value'],
    budgetTier: 'budget',
    vegFriendly: true,
    sustainabilityScore: 84,
    languages: ['Hindi', 'English', 'Bhojpuri'],
    crowdLevel: 'high',
    temperature: '28°C',
    pulseEvent: 'Dev Deepawali prep starting tonight near Dashashwamedh Ghat.',
    coordinates: { lat: 25.3176, lng: 82.9739 },
    isInternational: false,
    activities: [
      { id: 'v1', title: 'Subah-e-Banaras Dawn Boat Tour', price: 800, provider: 'Local Tour Provider' },
      { id: 'v2', title: 'Weaving Workshop in Weaver Colony', price: 500, provider: 'Kashi Weaves Co-op' },
      { id: 'v3', title: 'Spiritual Ghat Walk & Aarti Seating', price: 300, provider: 'Temple Trust Guild' }
    ],
    hotels: [
      { id: 'vh1', name: 'Alka Sanctuary on the Ghats', price: 2500, rating: 4.6, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80' },
      { id: 'vh2', name: 'BrijRama Palace - Heritage Luxury Stays', price: 22000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
      { id: 'vh3', name: 'Ganga Kripa Vedic Homestay', price: 1200, rating: 4.3, provider: 'Airbnb', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'vf1', airline: 'IndiGo (DEL - VNS)', price: 4200, duration: '1h 20m', provider: 'MakeMyTrip' },
      { id: 'vf2', airline: 'Air India Express (BOM - VNS)', price: 5900, duration: '2h 10m', provider: 'MakeMyTrip' }
    ],
    trains: [
      { id: 'vt1', name: 'Vande Bharat Express (22436)', class: 'CC (Chair Car)', price: 1750, provider: 'IRCTC' },
      { id: 'vt2', name: 'Shiv Ganga Express (12560)', class: '3A (3-Tier AC)', price: 1100, provider: 'IRCTC' }
    ]
  },
  {
    id: 'leh',
    name: 'Leh-Ladakh',
    state: 'Ladakh',
    description: 'An alpine desert bounded by snow-capped Himalayan ranges. Cross high passes like Khardung La, capture the deep azure of Pangong Tso, and find tranquility in remote Buddhist monasteries.',
    imageUrl: 'https://images.unsplash.com/photo-1581793745862-f4fde72f148d?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['adventurer', 'eco'],
    budgetTier: 'premium',
    vegFriendly: false,
    sustainabilityScore: 92,
    languages: ['Ladakhi', 'Hindi', 'English'],
    crowdLevel: 'low',
    temperature: '14°C',
    pulseEvent: 'Khardung La Pass clear; oxygen warnings issued for new arrivals.',
    coordinates: { lat: 34.1526, lng: 77.5771 },
    isInternational: false,
    activities: [
      { id: 'l1', title: 'Hemis Monastery Guided Tour', price: 600, provider: 'Monastic Cultural Trust' },
      { id: 'l2', title: 'River Rafting in Zanskar Cold waters', price: 2200, provider: 'Leh Adventure Sports' },
      { id: 'l3', title: 'Nubra Valley Camel Ride & Desert Safari', price: 1200, provider: 'Hunder Sand Dunes Union' }
    ],
    hotels: [
      { id: 'lh1', name: 'The Grand Dragon Ladakh', price: 9500, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=500&q=80' },
      { id: 'lh2', name: 'Eco-Nomadic Yurts Pangong', price: 4500, rating: 4.5, provider: 'Airbnb', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80' },
      { id: 'lh3', name: 'Lchang Nang Retreat - Organic Eco Resort', price: 16000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'lf1', airline: 'SpiceJet (DEL - IXL)', price: 7800, duration: '1h 25m', provider: 'MakeMyTrip' },
      { id: 'lf2', airline: 'IndiGo (BOM - IXL via DEL)', price: 12500, duration: '4h 15m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    description: 'Home of the legendary Taj Mahal, Agra Fort, and Fatehpūr Sikrī. Witness the marble monument of eternal love, experience Mughal heritage architectures, and sample local Petha sweets.',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'luxury'],
    budgetTier: 'premium',
    vegFriendly: true,
    sustainabilityScore: 80,
    languages: ['Hindi', 'Urdu', 'English'],
    crowdLevel: 'high',
    temperature: '32°C',
    pulseEvent: 'Taj Mahal night viewing reservations open; high crowd index expected.',
    coordinates: { lat: 27.1751, lng: 78.0421 },
    isInternational: false,
    activities: [
      { id: 'a1', title: 'Taj Mahal Skip-the-line Guided Walk', price: 950, provider: 'Agra Tourism Guides' },
      { id: 'a2', title: 'Agra Fort Mughal Heritage Walk', price: 600, provider: 'ASI Trust' },
      { id: 'a3', title: 'Local Marble Inlay Art Workshop', price: 400, provider: 'Taj Artisans Co-op' }
    ],
    hotels: [
      { id: 'ah1', name: 'The Oberoi Amarvilas - Taj Views', price: 38000, rating: 5.0, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'ah2', name: 'Howard Plaza The Fern', price: 4500, rating: 4.4, provider: 'MakeMyTrip', imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'af1', airline: 'IndiGo (DEL - AGR)', price: 3200, duration: '0h 50m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    description: 'A UNESCO World Heritage site showcasing the majestic ruins of the Vijayanagara Empire. Climb Matanga Hill, cross the Tungabhadra in a coracle, and discover ancient stone chariots.',
    imageUrl: 'https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'value', 'eco'],
    budgetTier: 'budget',
    vegFriendly: true,
    sustainabilityScore: 89,
    languages: ['Kannada', 'Telugu', 'Hindi', 'English'],
    crowdLevel: 'moderate',
    temperature: '29°C',
    pulseEvent: 'Coracle boat operations active near Vittala Temple ghats.',
    coordinates: { lat: 15.3350, lng: 76.4600 },
    isInternational: false,
    activities: [
      { id: 'ham1', title: 'Stone Chariot & Royal Enclosure Walk', price: 500, provider: 'Hampi Guides Guild' },
      { id: 'ham2', title: 'Tungabhadra River Coracle Crossing', price: 250, provider: 'Local Ferry Union' }
    ],
    hotels: [
      { id: 'hamh1', name: 'Evolve Back Hampi - Royal Palace', price: 26000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=500&q=80' },
      { id: 'hamh2', name: 'Hampi Boulders Eco Lodge', price: 6500, rating: 4.5, provider: 'MakeMyTrip', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'hamf1', airline: 'Star Air (BLR - VDY Jindal)', price: 3400, duration: '1h 00m', provider: 'MakeMyTrip' }
    ]
  },

  // International Destinations
  {
    id: 'tokyo',
    name: 'Tokyo',
    state: 'Japan',
    description: 'A neon-lit metropolis combining cutting-edge technology with ancient shrines. Explore Shibuya Crossing, walk the historic Senso-ji temple grounds, and enjoy world-class sushi bars.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['adventurer', 'luxury'],
    budgetTier: 'luxury',
    vegFriendly: false,
    sustainabilityScore: 91,
    languages: ['Japanese', 'English'],
    crowdLevel: 'high',
    temperature: '18°C',
    pulseEvent: 'Cherry blossom forecasts indicate full bloom near Ueno Park.',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    isInternational: true,
    visaInfo: 'E-Visa required (72h processing for Indian citizens, ₹1,500 fee)',
    currency: 'JPY (¥)',
    exchangeRate: '1 JPY = 0.54 INR',
    activities: [
      { id: 't1', title: 'TeamLab Planets Digital Museum Tickets', price: 2600, provider: 'teamLab Tokyo' },
      { id: 't2', title: 'Shinjuku Robot & Neon Food Tour', price: 4500, provider: 'Tokyo Local Guide' }
    ],
    hotels: [
      { id: 'th1', name: 'The Ritz-Carlton Tokyo', price: 65000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'th2', name: 'Shinjuku Granbell Boutique Hotel', price: 12000, rating: 4.4, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'tf1', airline: 'Japan Airlines (DEL - NRT Direct)', price: 48000, duration: '7h 15m', provider: 'MakeMyTrip' },
      { id: 'tf2', airline: 'Singapore Airlines (BOM - NRT via SIN)', price: 54000, duration: '9h 45m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'bali',
    name: 'Bali',
    state: 'Indonesia',
    description: 'The Island of the Gods. Famous for its forested volcanic mountains, iconic rice paddies, sandy beaches, coral reefs, and ancient Hindu shrines like Uluwatu Temple.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'eco', 'value'],
    budgetTier: 'premium',
    vegFriendly: true,
    sustainabilityScore: 88,
    languages: ['Indonesian', 'Balinese', 'English'],
    crowdLevel: 'moderate',
    temperature: '28°C',
    pulseEvent: 'Sunset fire dances scheduled at Uluwatu Cliff Temple at 6:00 PM.',
    coordinates: { lat: -8.4095, lng: 115.1889 },
    isInternational: true,
    visaInfo: 'Visa on Arrival (VoA) valid for 30 days (₹2,700 approx)',
    currency: 'IDR (Rp)',
    exchangeRate: '1 INR = 195 IDR',
    activities: [
      { id: 'b1', title: 'Mount Batur Sunrise Guided Trekking', price: 1800, provider: 'Kintamani Trekking Association' },
      { id: 'b2', title: 'Uluwatu Kecak Fire Dance sunset tickets', price: 800, provider: 'Uluwatu Culture Guild' }
    ],
    hotels: [
      { id: 'bh1', name: 'Maya Ubud Resort & Forest Spa', price: 15500, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=80' },
      { id: 'bh2', name: 'Ubud Bamboo Jungle Homestay', price: 3500, rating: 4.6, provider: 'Airbnb', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'bf1', airline: 'Batik Air (DEL - DPS via KUL)', price: 26000, duration: '8h 20m', provider: 'MakeMyTrip' },
      { id: 'bf2', airline: 'VietJet Air (BOM - DPS via SGN)', price: 23000, duration: '9h 10m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'paris',
    name: 'Paris',
    state: 'France',
    description: 'The City of Light. Discover architectural wonders like the Eiffel Tower, the Gothic Notre-Dame cathedral, and world-famous museums like the Louvre housing the Mona Lisa.',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'value'],
    budgetTier: 'luxury',
    vegFriendly: false,
    sustainabilityScore: 82,
    languages: ['French', 'English'],
    crowdLevel: 'high',
    temperature: '16°C',
    pulseEvent: 'Louvre museum entry tickets sold out for today. Advance online slots recommended.',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    isInternational: true,
    visaInfo: 'Schengen Visa required (Apply 15 days in advance, ₹7,200 fee)',
    currency: 'EUR (€)',
    exchangeRate: '1 EUR = 90 INR',
    activities: [
      { id: 'p1', title: 'Eiffel Tower Summit Access & Guide', price: 3200, provider: 'Paris Landmarks Assoc' },
      { id: 'p2', title: 'Louvre Museum Timed-entry Guided Walk', price: 2400, provider: 'Louvre Curators' }
    ],
    hotels: [
      { id: 'ph1', name: 'Shangri-La Paris - Eiffel Views', price: 95000, rating: 5.0, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'ph2', name: 'Le Pavillon de la Reine Marais', price: 28000, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'pf1', airline: 'Air India (DEL - CDG Direct)', price: 58000, duration: '9h 05m', provider: 'MakeMyTrip' },
      { id: 'pf2', airline: 'Gulf Air (BOM - CDG via BAH)', price: 44000, duration: '11h 25m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'singapore',
    name: 'Singapore',
    state: 'Singapore',
    description: 'A global financial hub and garden city. Marvel at the futuristic Supertree Grove at Gardens by the Bay, ride the Singapore Flyer, and shop along Orchard Road.',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'eco'],
    budgetTier: 'premium',
    vegFriendly: true,
    sustainabilityScore: 94,
    languages: ['English', 'Malay', 'Mandarin', 'Tamil'],
    crowdLevel: 'moderate',
    temperature: '31°C',
    pulseEvent: 'Spectra light and water show scheduled at Marina Bay Sands at 8:00 PM.',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    isInternational: true,
    visaInfo: 'E-Visa required (24-48h processing, ₹3,000 fee)',
    currency: 'SGD ($)',
    exchangeRate: '1 SGD = 62 INR',
    activities: [
      { id: 'sg1', title: 'Gardens by the Bay Double Flower Dome entry', price: 2100, provider: 'Gardens by the Bay' },
      { id: 'sg2', title: 'Night Safari Adventure Tram ride', price: 2800, provider: 'Singapore Zoo Alliance' }
    ],
    hotels: [
      { id: 'sgh1', name: 'Marina Bay Sands - Infinity Pool Stays', price: 48000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'sgh2', name: 'Carlton Hotel Singapore', price: 14000, rating: 4.5, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'sgf1', airline: 'Singapore Airlines (DEL - SIN Direct)', price: 24000, duration: '5h 40m', provider: 'MakeMyTrip' },
      { id: 'sgf2', airline: 'Air India Express (BOM - SIN Direct)', price: 17500, duration: '5h 50m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    state: 'Thailand',
    description: 'A vibrant capital known for its ornate shrines, active street life, and the historic Grand Palace. Shop at Chatuchak Weekend Market and ride a tuk-tuk down Khao San Road.',
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['value', 'adventurer'],
    budgetTier: 'budget',
    vegFriendly: true,
    sustainabilityScore: 78,
    languages: ['Thai', 'English'],
    crowdLevel: 'high',
    temperature: '33°C',
    pulseEvent: 'Water transport ferries operating normally on Chao Phraya River.',
    coordinates: { lat: 13.7563, lng: 100.5018 },
    isInternational: true,
    visaInfo: 'Visa on Arrival / eVisa (Indian citizens fee waived under promotional schemes)',
    currency: 'THB (฿)',
    exchangeRate: '1 THB = 2.3 INR',
    activities: [
      { id: 'bg1', title: 'Grand Palace & Wat Phra Kaew Guided Tour', price: 1100, provider: 'Siam Cultural Guides' },
      { id: 'bg2', title: 'Chao Phraya Princess Dinner Cruise', price: 1800, provider: 'Chao Phraya Cruises' }
    ],
    hotels: [
      { id: 'bgh1', name: 'Lebua at State Tower - Sky Bar Views', price: 9800, rating: 4.7, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
      { id: 'bgh2', name: 'Lub d Bangkok Siam Hostel', price: 1800, rating: 4.4, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'bgf1', airline: 'Thai Airways (DEL - BKK Direct)', price: 16500, duration: '4h 00m', provider: 'MakeMyTrip' },
      { id: 'bgf2', airline: 'Air India (BOM - BKK Direct)', price: 15000, duration: '4h 15m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'dubai',
    name: 'Dubai',
    state: 'UAE',
    description: 'An oasis of ultramodern architecture and high-end shopping. Ascend the Burj Khalifa, slide down snow slopes at Ski Dubai, and cruise the historical Dubai Creek in an abra.',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'adventurer'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 81,
    languages: ['Arabic', 'English', 'Hindi'],
    crowdLevel: 'high',
    temperature: '36°C',
    pulseEvent: 'Fountain display shows running every 30 minutes at Dubai Mall starting 6:00 PM.',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    isInternational: true,
    visaInfo: 'Pre-arranged eVisa required (30-day single entry, ₹7,500 approx)',
    currency: 'AED (د.إ)',
    exchangeRate: '1 AED = 22.6 INR',
    activities: [
      { id: 'db1', title: 'Burj Khalifa 124th + 125th Floor Observatory Ticket', price: 3800, provider: 'Emaar Properties' },
      { id: 'db2', title: 'Red Dunes Desert Safari & BBQ Dinner', price: 2500, provider: 'Arabian Nights Safaris' }
    ],
    hotels: [
      { id: 'dbh1', name: 'Atlantis The Palm - Aqua Stays', price: 34000, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'dbh2', name: 'Rove Downtown Dubai', price: 7200, rating: 4.6, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'dbf1', airline: 'Emirates (BOM - DXB Direct)', price: 21000, duration: '3h 10m', provider: 'MakeMyTrip' },
      { id: 'dbf2', airline: 'IndiGo (DEL - DXB Direct)', price: 15500, duration: '3h 45m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'switzerland',
    name: 'Switzerland',
    state: 'Switzerland',
    description: 'A mountainous Central European nation, home to numerous lakes, villages, and the high peaks of the Alps. Journey to Jungfraujoch, the top of Europe, and cruise Lake Lucerne.',
    imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['adventurer', 'luxury', 'eco'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 96,
    languages: ['German', 'French', 'Italian', 'English'],
    crowdLevel: 'moderate',
    temperature: '15°C',
    pulseEvent: 'Lucerne train lines fully operational; panoramic pass discounts available.',
    coordinates: { lat: 46.8182, lng: 8.2275 },
    isInternational: true,
    visaInfo: 'Schengen Visa required (Apply 20 days in advance, ₹7,200 fee)',
    currency: 'CHF (Fr)',
    exchangeRate: '1 CHF = 91.5 INR',
    activities: [
      { id: 'sw1', title: 'Mount Titlis Rotary Cable Car Pass', price: 8200, provider: 'Engelberg Titlis Group' },
      { id: 'sw2', title: 'Lake Lucerne Scenic Yacht Cruise', price: 3400, provider: 'SGV Lake Navigation' }
    ],
    hotels: [
      { id: 'swh1', name: 'Victoria Jungfrau Grand Hotel Interlaken', price: 42000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'swh2', name: 'Backpackers Villa Sonnenhof - Eco Hostel', price: 4500, rating: 4.7, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'swf1', airline: 'Swiss International Air (DEL - ZRH Direct)', price: 62000, duration: '8h 30m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'usa',
    name: 'New York',
    state: 'USA',
    description: 'A metropolitan center consisting of 5 boroughs where the Hudson River meets the Atlantic Ocean. Stroll Central Park, view Times Square, and cross the Brooklyn Bridge.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'adventurer'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 83,
    languages: ['English', 'Spanish'],
    crowdLevel: 'high',
    temperature: '21°C',
    pulseEvent: 'Broadway musical theater bookings open; high weekend demand forecast.',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    isInternational: true,
    visaInfo: 'US B1/B2 Tourist Visa required (Requires interview booking, ₹15,500 fee)',
    currency: 'USD ($)',
    exchangeRate: '1 USD = 83.5 INR',
    activities: [
      { id: 'us1', title: 'Empire State Building 86th Floor Observatory Ticket', price: 3600, provider: 'ESB Observatory' },
      { id: 'us2', title: 'Statue of Liberty & Ellis Island Guided Ferry Tour', price: 2400, provider: 'Statue Cruises' }
    ],
    hotels: [
      { id: 'ush1', name: 'The Plaza New York - Luxury Suites', price: 78000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'ush2', name: 'Pod 39 Budget Smart Hotel Manhattan', price: 11000, rating: 4.3, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'usf1', airline: 'Air India (DEL - JFK Direct)', price: 78000, duration: '14h 50m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'london',
    name: 'London',
    state: 'United Kingdom',
    description: 'The historic capital of England and the UK. Tour the Houses of Parliament, ride the London Eye, explore the Tower of London, and see the Changing of the Guard.',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'value'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 87,
    languages: ['English'],
    crowdLevel: 'high',
    temperature: '17°C',
    pulseEvent: 'Tower Bridge pathways active; afternoon river cruises operating regularly.',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    isInternational: true,
    visaInfo: 'Standard Visitor Visa required (Apply 21 days in advance, ₹12,000 fee)',
    currency: 'GBP (£)',
    exchangeRate: '1 GBP = 106 INR',
    activities: [
      { id: 'ln1', title: 'London Eye Panoramic Flight Ticket', price: 3400, provider: 'Merlin Attractions' },
      { id: 'ln2', title: 'Tower of London & Crown Jewels entry', price: 2900, provider: 'Historic Royal Palaces' }
    ],
    hotels: [
      { id: 'lnh1', name: 'The Savoy London - Strand Luxury', price: 68000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'lnh2', name: 'CitizenM Tower of London Smart Rooms', price: 14500, rating: 4.5, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'lnf1', airline: 'Virgin Atlantic (DEL - LHR Direct)', price: 54000, duration: '9h 15m', provider: 'MakeMyTrip' },
      { id: 'lnf2', airline: 'British Airways (BOM - LHR Direct)', price: 56000, duration: '9h 30m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'sydney',
    name: 'Sydney',
    state: 'Australia',
    description: 'Capital of New South Wales and one of Australia\'s largest cities, best known for its Sydney Opera House, Harbour Bridge, and sandy Bondi Beach.',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['adventurer', 'eco'],
    budgetTier: 'premium',
    vegFriendly: true,
    sustainabilityScore: 90,
    languages: ['English'],
    crowdLevel: 'moderate',
    temperature: '19°C',
    pulseEvent: 'Bondi coastal walk clear; low UV index warnings active for afternoons.',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    isInternational: true,
    visaInfo: 'Electronic Travel Authority (ETA Subclass 601, ₹1,200 fee)',
    currency: 'AUD ($)',
    exchangeRate: '1 AUD = 55.4 INR',
    activities: [
      { id: 'sy1', title: 'Sydney Opera House Guided Behind-the-Scenes Tour', price: 2400, provider: 'Opera House Trust' },
      { id: 'sy2', title: 'Sydney Harbour Bridge Climb adventure', price: 18500, provider: 'BridgeClimb Sydney' }
    ],
    hotels: [
      { id: 'syh1', name: 'Four Seasons Hotel Sydney - Opera Views', price: 24000, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'syh2', name: 'Sydney Harbour YHA - Historic Eco Stay', price: 4800, rating: 4.6, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'syf1', airline: 'Qantas Airways (DEL - SYD Direct)', price: 68000, duration: '12h 10m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'cairo',
    name: 'Cairo',
    state: 'Egypt',
    description: 'Egypt\'s sprawling capital, set on the Nile River. Explore the iconic Giza Pyramids, Great Sphinx, and the treasure-filled Egyptian Museum.',
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'value'],
    budgetTier: 'budget',
    vegFriendly: false,
    sustainabilityScore: 73,
    languages: ['Arabic', 'English'],
    crowdLevel: 'high',
    temperature: '26°C',
    pulseEvent: 'Grand Egyptian Museum halls partially open. High tourist queues.',
    coordinates: { lat: 30.0444, lng: 31.2357 },
    isInternational: true,
    visaInfo: 'Visa on Arrival / Online eVisa (30 days validity, ₹2,100 approx)',
    currency: 'EGP (£)',
    exchangeRate: '1 EGP = 1.76 INR',
    activities: [
      { id: 'ca1', title: 'Giza Pyramids & Sphinx Half-Day Camel Ride', price: 1600, provider: 'Pyramids Horse Association' },
      { id: 'ca2', title: 'Egyptian Museum entry tickets & local audio guide', price: 900, provider: 'Antiquities Department' }
    ],
    hotels: [
      { id: 'cah1', name: 'Marriott Mena House - Pyramids View', price: 21000, rating: 4.8, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'cah2', name: 'Cairo Center Boutique Inn', price: 2400, rating: 4.2, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'caf1', airline: 'EgyptAir (BOM - CAI Direct)', price: 34000, duration: '6h 15m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'maldives',
    name: 'Maldives',
    state: 'Maldives',
    description: 'A tropical nation in the Indian Ocean composed of 26 ring-shaped atolls. Renowned for its coral reefs, blue lagoons, and private overwater villa resorts.',
    imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['luxury', 'eco'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 93,
    languages: ['Dhivehi', 'English'],
    crowdLevel: 'low',
    temperature: '29°C',
    pulseEvent: 'Atoll speedboats running regularly; marine bioluminescence forecast tonight.',
    coordinates: { lat: 3.2028, lng: 73.2207 },
    isInternational: true,
    visaInfo: 'Visa Free on Arrival (30 days stay granted to all nationalities free)',
    currency: 'MVR (Rf)',
    exchangeRate: '1 MVR = 5.4 INR',
    activities: [
      { id: 'mv1', title: 'Coral Reef Snorkeling Tour with Marine Biologist', price: 4200, provider: 'Maafushi Marine Center' },
      { id: 'mv2', title: 'Sunset Catamaran Fishing Cruise & Grill', price: 3200, provider: 'Atoll Leisure Union' }
    ],
    hotels: [
      { id: 'mvh1', name: 'Soneva Fushi Overwater Eco Luxury', price: 110000, rating: 5.0, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'mvh2', name: 'Kaani Grand Seaview Maafushi', price: 6800, rating: 4.5, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'mvf1', airline: 'IndiGo (BOM - MLE Direct)', price: 14500, duration: '2h 45m', provider: 'MakeMyTrip' },
      { id: 'mvf2', airline: 'Maldivian Air (DEL - MLE Direct)', price: 19800, duration: '4h 15m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'rome',
    name: 'Rome',
    state: 'Italy',
    description: 'A sprawling cosmopolitan city with nearly 3,000 years of globally influential art, architecture, and culture on display. Tour the Colosseum and Vatican City.',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['spiritual', 'luxury'],
    budgetTier: 'luxury',
    vegFriendly: true,
    sustainabilityScore: 84,
    languages: ['Italian', 'English'],
    crowdLevel: 'high',
    temperature: '22°C',
    pulseEvent: 'Vatican Museums and Colosseum online reservations fully active.',
    coordinates: { lat: 41.9028, lng: 12.4964 },
    isInternational: true,
    visaInfo: 'Schengen Visa required (Apply 15 days in advance, ₹7,200 fee)',
    currency: 'EUR (€)',
    exchangeRate: '1 EUR = 90 INR',
    activities: [
      { id: 'rm1', title: 'Colosseum, Forum & Palatine Skip-the-line Guide', price: 3400, provider: 'Roma Monuments' },
      { id: 'rm2', title: 'Vatican Museums & Sistine Chapel Tickets', price: 2800, provider: 'Vatican Curia' }
    ],
    hotels: [
      { id: 'rmh1', name: 'Hotel de Russie Rome - Luxury Gardens', price: 54000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' },
      { id: 'rmh2', name: 'Otivm Boutique Hotel Rome', price: 16000, rating: 4.6, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'rmf1', airline: 'ITA Airways (DEL - FCO Direct)', price: 46000, duration: '8h 45m', provider: 'MakeMyTrip' }
    ]
  },
  {
    id: 'vietnam',
    name: 'Hanoi',
    state: 'Vietnam',
    description: 'Known for its centuries-old architecture and a rich culture with Southeast Asian, Chinese, and French influences. Sail through the mystical islands of Ha Long Bay.',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    archetypes: ['value', 'eco', 'adventurer'],
    budgetTier: 'budget',
    vegFriendly: true,
    sustainabilityScore: 88,
    languages: ['Vietnamese', 'English'],
    crowdLevel: 'moderate',
    temperature: '25°C',
    pulseEvent: 'Ha Long Bay boat tours active. Local night food markets running normally.',
    coordinates: { lat: 21.0285, lng: 105.8542 },
    isInternational: true,
    visaInfo: 'E-Visa required (24-72h online processing, ₹2,100 approx)',
    currency: 'VND (₫)',
    exchangeRate: '1 INR = 305 VND',
    activities: [
      { id: 'vn1', title: 'Ha Long Bay Luxury Day Cruise & Kayaking', price: 3200, provider: 'Ha Long Cruises Co' },
      { id: 'vn2', title: 'Hanoi Old Quarter Street Food Guided Walk', price: 900, provider: 'Hanoi Local Guides' }
    ],
    hotels: [
      { id: 'vnh1', name: 'Sofitel Legend Metropole Hanoi', price: 18000, rating: 4.9, provider: 'Booking.com', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
      { id: 'vnh2', name: 'Hanoi Old Quarter Eco Homestay', price: 1600, rating: 4.5, provider: 'Airbnb', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' }
    ],
    flights: [
      { id: 'vnf1', airline: 'VietJet Air (DEL - HAN Direct)', price: 11500, duration: '4h 05m', provider: 'MakeMyTrip' },
      { id: 'vnf2', airline: 'Vietnam Airlines (BOM - HAN Direct)', price: 13800, duration: '4h 20m', provider: 'MakeMyTrip' }
    ]
  }
];

export const MOCK_REVIEWS = [
  {
    id: 'r1',
    author: 'Aanya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    archetype: 'eco',
    destination: 'Bali',
    rating: 5,
    text: 'GOBRO recommended the bamboo treehouse in Ubud. The local language phrasebook was incredibly handy, and the visa guidelines saved us from long queues!',
    mediaUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'r2',
    author: 'Rohan Malhotra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    archetype: 'adventurer',
    destination: 'Leh-Ladakh',
    rating: 5,
    text: 'Pangong road trip was epic! The ML crowd predictor helped us cross Khardung La early in the morning when the load was just 20%. Lifesaver copilot.',
    mediaUrl: 'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?auto=format&fit=crop&w=600&q=80'
  }
];
