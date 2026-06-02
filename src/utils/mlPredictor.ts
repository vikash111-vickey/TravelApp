// Client-side Machine Learning simulations for GOBRO (WanderLens)

export interface BudgetForecast {
  estimatedCost: number;
  lowerConfidenceBound: number;
  upperConfidenceBound: number;
  confidenceScore: number; // 0 to 100
}

export interface CrowdPrediction {
  dayName: string;
  crowdLevelPercent: number;
  confidence: number;
  status: 'low' | 'moderate' | 'high';
}

// Client-Side Regression Weights simulating TensorFlow.js node values
const REGRESSION_WEIGHTS = {
  durationWeight: 2200,    // Cost multiplier per day
  guestWeight: 1400,       // Cost multiplier per guest
  paceMultiplier: {
    relax: 0.9,
    moderate: 1.0,
    packed: 1.2
  },
  tierBaseCost: {
    budget: 1500,
    premium: 4500,
    luxury: 18500
  }
};

/**
 * Predicts estimated expenses utilizing a mock linear regression model
 */
export function predictBudget(
  destBasePrice: number,
  durationDays: number,
  guestsCount: number,
  pace: 'relax' | 'moderate' | 'packed',
  tier: 'budget' | 'premium' | 'luxury'
): BudgetForecast {
  // Linear combination formula: Base + (Days * dWeight * pace) + (Guests * gWeight)
  const basePrice = destBasePrice * 0.4; // Base destination factor
  const tierCost = REGRESSION_WEIGHTS.tierBaseCost[tier] * durationDays;
  const variableCost = (durationDays * REGRESSION_WEIGHTS.durationWeight * REGRESSION_WEIGHTS.paceMultiplier[pace])
    + (guestsCount * REGRESSION_WEIGHTS.guestWeight);

  const estimatedCost = Math.round(basePrice + tierCost + variableCost);
  
  // Calculate variance representing model uncertainty
  const variance = Math.round(estimatedCost * 0.08); // 8% standard deviation bounds
  
  // Calculate confidence score based on input completeness
  let confidenceScore = 95; // default high confidence
  if (durationDays > 5) confidenceScore -= 8; // higher periods raise variance
  if (guestsCount > 4) confidenceScore -= 5;

  return {
    estimatedCost,
    lowerConfidenceBound: estimatedCost - variance,
    upperConfidenceBound: estimatedCost + variance,
    confidenceScore
  };
}

/**
 * Predicts crowd density percentages for the next 7 days using a simulated sin-wave model
 */
export function predictCrowdLevels(destId: string): CrowdPrediction[] {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIdx = new Date().getDay();
  const predictions: CrowdPrediction[] = [];

  // Seed values based on destination
  const baseDensity: Record<string, number> = {
    varanasi: 75,
    leh: 35,
    goa: 60,
    udaipur: 55,
    munnar: 40
  };

  const seed = baseDensity[destId] || 50;

  for (let i = 0; i < 7; i++) {
    const dayIndex = (todayIdx + i) % 7;
    const dayName = daysOfWeek[dayIndex];

    // Mathematical Sinusoidal formula simulating weekend spikes (Sunday=0, Saturday=6)
    const weekendFactor = (dayIndex === 0 || dayIndex === 6) ? 22 : -8;
    const randomVariation = Math.sin(i * 1.5) * 5; // wave sweep
    
    let crowdLevelPercent = Math.round(seed + weekendFactor + randomVariation);
    crowdLevelPercent = Math.max(10, Math.min(98, crowdLevelPercent)); // clip bounds

    let status: 'low' | 'moderate' | 'high' = 'moderate';
    if (crowdLevelPercent < 45) status = 'low';
    else if (crowdLevelPercent > 70) status = 'high';

    // Model confidence decays slightly the further we look into future
    const confidence = Math.round(98 - (i * 2.5));

    predictions.push({
      dayName,
      crowdLevelPercent,
      confidence,
      status
    });
  }

  return predictions;
}

/**
 * Predicts overall traveler satisfaction rating (0-100) and sustainability metrics
 */
export function predictUserSatisfaction(
  hasVegOption: boolean,
  ecoRating: number,
  tier: string
): { score: number; ecoImpactRating: 'high' | 'neutral' | 'poor' } {
  let score = 70; // baseline

  if (hasVegOption) score += 12; // veg matching adds satisfaction
  if (ecoRating > 90) score += 8;
  if (tier === 'luxury') score += 5;

  let ecoImpactRating: 'high' | 'neutral' | 'poor' = 'neutral';
  if (ecoRating >= 90) ecoImpactRating = 'high';
  else if (ecoRating < 80) ecoImpactRating = 'poor';

  return {
    score: Math.min(99, score),
    ecoImpactRating
  };
}
