export type CharacterGender = 'male' | 'female';
export type OutfitColor = 'charcoal' | 'forest' | 'sand';

export interface GPSCoordinate {
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  accuracy: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: 'flora' | 'fauna' | 'geology' | 'water' | 'relic';
  lat: number;
  lng: number;
  distanceMeters: number;
  bearingDegrees: number;
  stereoPan: number; // -1.0 (Full Left) to +1.0 (Full Right)
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Legendary';
  discovered: boolean;
  lore: string;
  ecoStat: {
    bioMass: number;
    airPurity: number;
    symbiosis: number;
  };
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  targetPoiId: string;
  targetName: string;
  targetDistance: number;
  targetBearing: number;
  rewardXp: number;
  voicePrompt: string;
  status: 'active' | 'completed';
}

export interface EcoCard {
  id: string;
  title: string;
  scientificName: string;
  type: 'Flora' | 'Fauna' | 'Fungi' | 'Biome';
  rarity: 'Uncommon' | 'Rare' | 'Apex Specimen';
  image: string;
  stats: {
    canopyCover: number;
    carbonOffset: number;
    resilience: number;
    vitality: number;
  };
  coordinates: string;
  audioFrequency: string;
}

export interface LocalityWaypoint {
  id: string;
  name: string;
  category: 'Canopy' | 'Botanical' | 'Geo' | 'Fauna';
  description: string;
  audioPrompt: string;
  lat: number;
  lng: number;
  icon: string;
  completed: boolean;
  distanceMeters: number;
  bearingDegrees?: number;
}

export type GamePage = 'welcome' | 'playing' | 'challenges' | 'stickers' | 'biocards' | 'weather' | 'blueprint' | 'map';
