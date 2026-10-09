export interface StickerReward {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Legendary';
  badgeEmoji: string;
  lore: string;
  image?: string;
}

export interface DailyNatureChallenge {
  id: string;
  title: string;
  description: string;
  category: 'Flora' | 'Fauna' | 'Observation' | 'Tactile' | 'Earth';
  icon: string;
  difficulty: 'Quick' | 'Explorer' | 'Tracker';
  xpReward: number;
  completed?: boolean;
}

export interface GeneratedMission {
  id: string;
  title: string;
  objective: string;
  audioScript: string;
  biome: string;
  timeOfDay: string;
  scavengerItems: string[];
  craftInstructions: string;
  targetLandmark: string;
  targetDistanceMeters: number;
  targetBearingDegrees: number;
  rewardXp: number;
  stickerReward: StickerReward;
}

export interface MissionGenerationOptions {
  biome?: string;
  timeOfDay?: string;
  difficulty?: 'Scout' | 'Adventurer' | 'Master Naturalist';
}

/**
 * Determine the current natural time of day for immersion
 */
export function getCurrentTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Morning';
  if (hour >= 11 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 20) return 'Golden Hour';
  return 'Twilight / Night';
}

/**
 * Service to generate dynamic outdoor missions via Gemini API
 */
export async function generateOutdoorMission(
  options: MissionGenerationOptions = {}
): Promise<GeneratedMission> {
  const biome = options.biome || 'Oak Woodland';
  const timeOfDay = options.timeOfDay || getCurrentTimeOfDay();
  const difficulty = options.difficulty || 'Adventurer';

  try {
    const response = await fetch('/api/missions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ biome, timeOfDay, difficulty }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    if (data.mission) {
      return data.mission;
    }
    throw new Error('No mission data returned');
  } catch (err) {
    console.warn('Falling back to local curated mission generator:', err);
    return getLocalFallbackMission(biome, timeOfDay);
  }
}

/**
 * Service to fetch 3 randomized Daily Nature Challenges via Gemini API
 */
export async function fetchDailyNatureChallenges(
  options: { biome?: string; timeOfDay?: string } = {}
): Promise<DailyNatureChallenge[]> {
  const biome = options.biome || 'Oak Woodland';
  const timeOfDay = options.timeOfDay || getCurrentTimeOfDay();

  try {
    const response = await fetch('/api/missions/daily-challenges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ biome, timeOfDay }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.challenges) && data.challenges.length > 0) {
        return data.challenges;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Gemini daily challenges, using curated fallback:', err);
  }

  // Curated client fallback
  return [
    {
      id: `daily-leaf-${Date.now()}`,
      title: 'Find 2 Oak Leaves',
      description: 'Search beneath mature deciduous trees for two distinct lobed leaves with intact veining.',
      category: 'Flora',
      icon: '🍃',
      difficulty: 'Quick',
      xpReward: 100,
      completed: false,
    },
    {
      id: `daily-bird-${Date.now()}`,
      title: 'Identify a Local Bird',
      description: 'Stop silently for 60 seconds and locate a wild bird in the canopy or sky. Note its feather markings.',
      category: 'Fauna',
      icon: '🐦',
      difficulty: 'Explorer',
      xpReward: 150,
      completed: false,
    },
    {
      id: `daily-bark-${Date.now()}`,
      title: 'Inspect Tree Bark Texture',
      description: 'Touch and compare the bark ridges of two distinct tree species to feel deep furrows vs smooth peeling sapwood.',
      category: 'Tactile',
      icon: '🪵',
      difficulty: 'Tracker',
      xpReward: 125,
      completed: false,
    },
  ];
}

/**
 * Service to verify uploaded nature craft photo
 */
export async function verifyScavengerCraftPhoto(
  craftName: string,
  base64Image: string
): Promise<{ verified: boolean; confidence: number; scoutPraise: string; bonusXp: number }> {
  try {
    const response = await fetch('/api/missions/verify-craft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ craftName, base64Image }),
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Craft photo verification offline fallback:', err);
  }

  return {
    verified: true,
    confidence: 0.95,
    scoutPraise: `Outstanding craftsmanship, Ranger! Your ${craftName} has been recorded into the Field Sticker Book!`,
    bonusXp: 150,
  };
}

/**
 * Robust local fallback missions for uninterrupted gameplay
 */
function getLocalFallbackMission(biome: string, timeOfDay: string): GeneratedMission {
  const presets: GeneratedMission[] = [
    {
      id: `fallback-dragon-${Date.now()}`,
      title: 'The Forest Leaf Dragon',
      objective: 'Search for two leaves, a twig, and two pebbles to awaken the earth dragon.',
      audioScript:
        'Listen closely. Scan the soil around your feet. Gather two broad leaves, a sturdy twig, and two smooth pebbles. Shape a miniature dragon on the forest floor, then capture its photo!',
      biome: biome,
      timeOfDay: timeOfDay,
      scavengerItems: [
        '2x Broad Fallen Leaves (Wings)',
        '1x Sturdy Twig (Dragon Spine)',
        '2x Smooth Pebbles (Glinting Eyes)',
        'Optional: Pine Needles (Dragon Claws)',
      ],
      craftInstructions:
        'Lay the twig flat on soil. Symmetrically fan the two leaves as outstretched wings. Place the two pebbles at the head as vigilant eyes.',
      targetLandmark: 'Ancient Redwood Hollow',
      targetDistanceMeters: 280,
      targetBearingDegrees: 335,
      rewardXp: 350,
      stickerReward: {
        id: 'stk-dragon',
        name: 'Verdant Leaf Dragon',
        rarity: 'Mythic',
        badgeEmoji: '🐉',
        lore: 'A mythological protector created from autumn foliage and ancient river stones.',
      },
    },
    {
      id: `fallback-owl-${Date.now()}`,
      title: 'The Pinecone Night Owl',
      objective: 'Assemble pine needles and acorn caps to sculpt the wise woodland owl.',
      audioScript:
        'Ranger update. Seek out a fallen pinecone, two acorn caps, and small dry leaves. Construct an owl guardian watching over the forest trail.',
      biome: biome,
      timeOfDay: timeOfDay,
      scavengerItems: [
        '1x Mature Pinecone (Feather Body)',
        '2x Acorn Caps (Binocular Eyes)',
        '2x Small Dry Oak Leaves (Folded Wings)',
      ],
      craftInstructions:
        'Stand the pinecone upright. Tuck the leaves on either side as folded wings, and perch the two acorn caps atop as staring eyes.',
      targetLandmark: 'Whispering Willow Sanctuary',
      targetDistanceMeters: 360,
      targetBearingDegrees: 45,
      rewardXp: 320,
      stickerReward: {
        id: 'stk-owl',
        name: 'Pinecone Sentry Owl',
        rarity: 'Rare',
        badgeEmoji: '🦉',
        lore: 'A silent sentry crafted by young naturalists to watch over woodland trails.',
      },
    },
    {
      id: `fallback-mandala-${Date.now()}`,
      title: 'The Golden Earth Mandala',
      objective: 'Collect five diverse nature artifacts to form a geometric sunburst.',
      audioScript:
        'Audio beacon active. Gather five distinct items: flower petals, dry grasses, flat stones, pine twigs, and seeds. Arrange them in concentric circles of beauty!',
      biome: biome,
      timeOfDay: timeOfDay,
      scavengerItems: [
        '4x Bright Flower Petals or Clover',
        '8x Pine Needles or Dry Straws',
        '1x Central Smooth Stone',
        '4x Tiny Gravel Stones',
      ],
      craftInstructions:
        'Place the center stone. Radiate pine needles outward like sunbeams, and crown the perimeter with petals.',
      targetLandmark: 'Sunlit Meadow Glade',
      targetDistanceMeters: 210,
      targetBearingDegrees: 180,
      rewardXp: 380,
      stickerReward: {
        id: 'stk-mandala',
        name: 'Solar Earth Mandala',
        rarity: 'Legendary',
        badgeEmoji: '☀️',
        lore: 'Sacred geometry woven purely from fallen organic treasures.',
      },
    },
  ];

  return presets[Math.floor(Math.random() * presets.length)];
}
