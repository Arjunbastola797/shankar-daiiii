
export interface Destination {
  id: string;
  name: string;
  category: 'trekking' | 'culture' | 'adventure' | 'wildlife' | 'nature' | 'heritage' | 'pilgrimage' | 'urban' | 'hill-station';
  region: string;
  province: string;
  description: string;
  imageUrl: string;
  difficulty?: 'Easy' | 'Moderate' | 'Hard' | 'Extreme';
  altitude?: string;
  bestTime: string;
  mediums: ('Flight' | 'Bus' | 'Jeep' | 'Trek')[];
  priceRange: string;
  budgetLevel: 'Budget' | 'Mid-range' | 'Premium';
  rating?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 data
  sources?: GroundingSource[];
  mapLinks?: GroundingSource[];
  videoUri?: string;
  isVideoLoading?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SystemTheme {
  primaryColor: string;
  accentColor: string;
  mode: 'light' | 'sepia' | 'onyx';
  fontScale: number;
  glassOpacity: number;
}

// Added Festival interface to resolve import error in constants.tsx
export interface Festival {
  name: string;
  description: string;
  month: string;
  icon: string;
}
