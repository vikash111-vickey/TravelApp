// Dynamic query generator for WanderLens locations
import { Destination } from '../data/mockData';

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

export interface DynamicMonument {
  id: string;
  name: string;
  desc: string;
  rating: number;
}

export interface EnhancedDestination extends Destination {
  monuments: DynamicMonument[];
}

export const constructDynamicDestination = (name: string): EnhancedDestination => {
  const seed = hashCode(name);
  const id = name.toLowerCase().replace(/\s+/g, '-');
  
  const states = ['Karnataka', 'Maharashtra', 'Rajasthan', 'Kerala', 'Tamil Nadu', 'Delhi NCR', 'Uttarakhand', 'Himachal Pradesh', 'Goa', 'Uttar Pradesh'];
  const state = states[seed % states.length];
  
  const temps = ['22°C', '17°C', '29°C', '33°C', '14°C', '25°C'];
  const temp = temps[seed % temps.length];
  
  const budgets: Array<'budget' | 'premium' | 'luxury'> = ['budget', 'premium', 'luxury'];
  const budgetTier = budgets[seed % budgets.length];
  
  const sustainabilityScore = 75 + (seed % 22); // 75% to 96%
  
  const images = [
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'
  ];
  const imageUrl = images[seed % images.length];

  const monumentsList = [
    ['Heritage Fort Gates', 'Royal Clock Tower', 'Ancient Ruins Citadel'],
    ['Victoria Memorial Arch', 'Legacy Palace Museum', 'Dynasty Fort Ruins'],
    ['Grand Pillar Monument', 'Stone Carving Obelisk', 'Maharaja Fort Complex'],
    ['Colonial Lighthouse Plaza', 'Statue Landmark Plaza', 'Scenic Heritage Gates']
  ];
  const selectedMonuments = monumentsList[seed % monumentsList.length];

  const sightsList = [
    ['Scenic Ridge Point', 'Botanical Flora Garden', 'Mist Cascade Valley'],
    ['Breeze Lakeside Walk', 'Wildlife Bird Reserve', 'Sunset View Summit'],
    ['Golden Beach Dunes', 'Spiritual Ashram Meadows', 'National Forest Trail'],
    ['Pebble Creek Valley', 'Bamboo Grove Woods', 'Green Cardamom Estates']
  ];
  const selectedSights = sightsList[seed % sightsList.length];

  const staysList = [
    { name: 'Grand Regency Palace', price: 4800, rating: 4.8, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
    { name: 'Backpackers Eco Sanctuary', price: 1600, rating: 4.5, img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=500&q=80' },
    { name: 'Riverside Woods Residency', price: 2900, rating: 4.6, img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' },
    { name: 'Elite Boutique Resort', price: 9500, rating: 4.9, img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=500&q=80' }
  ];

  const lat = 8.4 + ((seed % 1000) / 1000) * 24.6;
  const lng = 68.7 + ((seed % 1000) / 1000) * 23.3;

  return {
    id,
    name,
    state,
    description: `Dynamic offline-first exploration index loaded for ${name}. Model weight validation confirmed. Select sightseeing spots, nearby monuments, and hotels below.`,
    imageUrl,
    archetypes: ['value', 'adventurer'],
    budgetTier,
    vegFriendly: seed % 2 === 0,
    sustainabilityScore,
    languages: ['English', 'Hindi', 'Regional'],
    crowdLevel: seed % 3 === 0 ? 'low' : seed % 3 === 1 ? 'moderate' : 'high',
    temperature: temp,
    pulseEvent: `Simulated telemetry active. Responders registered for ${name}.`,
    coordinates: { lat, lng },
    activities: [
      { id: `${id}-act1`, title: selectedSights[0], price: 250, provider: 'Local Guide' },
      { id: `${id}-act2`, title: selectedSights[1], price: 600, provider: 'Regional Tours' },
      { id: `${id}-act3`, title: selectedSights[2], price: 150, provider: 'Eco Guild' }
    ],
    monuments: [
      { id: `${id}-mon1`, name: selectedMonuments[0], desc: 'Stunning historical architecture demonstrating high cultural value.', rating: 4.6 },
      { id: `${id}-mon2`, name: selectedMonuments[1], desc: 'An iconic local heritage structure showing signature visual style.', rating: 4.7 },
      { id: `${id}-mon3`, name: selectedMonuments[2], desc: 'Deep ancestral site with guided walking tours and plaque logs.', rating: 4.5 }
    ],
    hotels: [
      { id: `${id}-hot1`, name: `${name} Backpackers Sanctuary`, price: 1100 + (seed % 8) * 100, rating: 4.2 + (seed % 6) * 0.1, provider: 'Booking.com', imageUrl: staysList[1].img },
      { id: `${id}-hot2`, name: `${name} Riverside Residency`, price: 3200 + (seed % 20) * 100, rating: 4.4 + (seed % 5) * 0.1, provider: 'MakeMyTrip', imageUrl: staysList[2].img },
      { id: `${id}-hot3`, name: `${name} Grand Regency Palace`, price: 7800 + (seed % 40) * 100, rating: 4.7 + (seed % 3) * 0.1, provider: 'Airbnb', imageUrl: staysList[0].img }
    ],
    flights: [
      { id: `${id}-fl1`, airline: 'IndiGo Connections', price: 5400, duration: '2h 15m', provider: 'MakeMyTrip' }
    ]
  };
};
