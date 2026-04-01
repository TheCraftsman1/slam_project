// Indian National Air Quality Index (NAQI) Calculator
// Based on CPCB (Central Pollution Control Board) guidelines
// Final AQI = Maximum sub-index among all monitored pollutants

type PollutantBreakpoints = {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
};

// ─── PM2.5 Breakpoints (24-hr avg in µg/m³) ─────────────────────────
const PM25_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 },      // Good: 0-50
  { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 },   // Satisfactory: 51-100
  { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 },  // Moderate: 101-200
  { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 }, // Poor: 201-300
  { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 251, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── PM10 Breakpoints (24-hr avg in µg/m³) ───────────────────────────
const PM10_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },       // Good: 0-50
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 }, // Satisfactory: 51-100
  { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },// Poor: 201-300
  { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 431, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── NO2 Breakpoints (24-hr avg in µg/m³) ───────────────────────────
const NO2_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },     // Good: 0-50
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },   // Satisfactory: 51-100
  { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },// Poor: 201-300
  { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 401, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── SO2 Breakpoints (24-hr avg in µg/m³) ───────────────────────────
const SO2_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },      // Good: 0-50
  { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },   // Satisfactory: 51-100
  { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },// Moderate: 101-200
  { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },// Poor: 201-300
  { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 1601, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── CO Breakpoints (8-hr max in mg/m³) ────────────────────────────────
const CO_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 0.5, iLow: 0, iHigh: 50 },    // Good: 0-50
  { cLow: 0.51, cHigh: 1.0, iLow: 51, iHigh: 100 }, // Satisfactory: 51-100
  { cLow: 1.01, cHigh: 2.0, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 2.01, cHigh: 10.0, iLow: 201, iHigh: 300 },  // Poor: 201-300
  { cLow: 10.01, cHigh: 17.4, iLow: 301, iHigh: 400 }, // Very Poor: 301-400
  { cLow: 17.41, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── O3 Breakpoints (8-hr max in µg/m³) ────────────────────────────────
const O3_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },     // Good: 0-50
  { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },   // Satisfactory: 51-100
  { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 }, // Poor: 201-300
  { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 749, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── NH3 Breakpoints (24-hr avg in µg/m³) ────────────────────────
const NH3_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 200, iLow: 0, iHigh: 50 },    // Good: 0-50
  { cLow: 201, cHigh: 400, iLow: 51, iHigh: 100 }, // Satisfactory: 51-100
  { cLow: 401, cHigh: 800, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 801, cHigh: 1200, iLow: 201, iHigh: 300 },// Poor: 201-300
  { cLow: 1201, cHigh: 1800, iLow: 301, iHigh: 400 },// Very Poor: 301-400
  { cLow: 1801, cHigh: 9999, iLow: 401, iHigh: 500 },// Severe: 401-500
];

// ─── Pb Breakpoints (24-hr avg in µg/m³) ───────────────────────────
const PB_BP: PollutantBreakpoints[] = [
  { cLow: 0, cHigh: 0.25, iLow: 0, iHigh: 50 },   // Good: 0-50
  { cLow: 0.26, cHigh: 0.5, iLow: 51, iHigh: 100 }, // Satisfactory: 51-100
  { cLow: 0.51, cHigh: 0.75, iLow: 101, iHigh: 200 }, // Moderate: 101-200
  { cLow: 0.76, cHigh: 1.0, iLow: 201, iHigh: 300 }, // Poor: 201-300
  { cLow: 1.01, cHigh: 1.5, iLow: 301, iHigh: 400 }, // Very Poor: 301-400
  { cLow: 1.51, cHigh: 9999, iLow: 401, iHigh: 500 }, // Severe: 401-500
];

/**
 * Calculate sub-index for a pollutant using linear interpolation
 */
function getSubIndex(concentration: number, breakpoints: PollutantBreakpoints[]): number {
  if (!Number.isFinite(concentration) || concentration < 0) return 0;
  
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      // Linear interpolation: I = ((Ih - Il) / (Ch - Cl)) * (C - Cl) + Il
      const slope = (bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow);
      const index = slope * (concentration - bp.cLow) + bp.iLow;
      return Math.round(index);
    }
  }
  
  // Extrapolate for values beyond highest breakpoint
  const last = breakpoints[breakpoints.length - 1];
  const slope = (last.iHigh - last.iLow) / (last.cHigh - last.cLow);
  return Math.round(slope * (concentration - last.cLow) + last.iLow);
}

/**
 * Calculates Indian NAQI from raw pollutant concentrations.
 * 
 * Requirements:
 * - Minimum 3 pollutants must be available
 * - At least one must be PM2.5 or PM10
 * - Final AQI = Maximum sub-index among all monitored pollutants
 * 
 * @param pollutants - Object containing pollutant concentrations
 * @returns NAQI value (0-500), or -1 if insufficient data
 */
export function calculateIndianNAQI(pollutants: {
  pm25?: number;   // µg/m³, 24-hr avg
  pm10?: number;   // µg/m³, 24-hr avg
  no2?: number;    // µg/m³, 24-hr avg
  so2?: number;   // µg/m³, 24-hr avg
  co?: number;    // mg/m³ (convert from µg/m³ if needed), 8-hr max
  o3?: number;    // µg/m³, 8-hr max
  nh3?: number;   // µg/m³, 24-hr avg
  pb?: number;     // µg/m³, 24-hr avg
}): number {
  const subIndices: number[] = [];
  const hasPM = (pollutants.pm25 ?? -1) >= 0 || (pollutants.pm10 ?? -1) >= 0;
  
  // Calculate sub-indices for available pollutants (skip if < 0 or undefined)
  if ((pollutants.pm25 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.pm25!, PM25_BP));
  }
  if ((pollutants.pm10 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.pm10!, PM10_BP));
  }
  if ((pollutants.no2 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.no2!, NO2_BP));
  }
  if ((pollutants.so2 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.so2!, SO2_BP));
  }
  if ((pollutants.co ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.co!, CO_BP));
  }
  if ((pollutants.o3 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.o3!, O3_BP));
  }
  if ((pollutants.nh3 ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.nh3!, NH3_BP));
  }
  if ((pollutants.pb ?? -1) >= 0) {
    subIndices.push(getSubIndex(pollutants.pb!, PB_BP));
  }
  
  // Validate: At least 3 pollutants, one must be PM2.5 or PM10
  if (subIndices.length < 3 || !hasPM) {
    return -1;
  }
  
  // NAQI = Maximum sub-index
  return Math.max(...subIndices);
}

/**
 * Get health advisory based on AQI category
 */
export function getAqiCategory(aqi: number): { 
  label: string; 
  color: string;
  advisory: string;
} {
  if (aqi <= 50) return { 
    label: 'Good', 
    color: '#22c55e', 
    advisory: 'Air quality is satisfactory. Enjoy outdoor activities!' 
  };
  if (aqi <= 100) return { 
    label: 'Satisfactory', 
    color: '#4ade80', 
    advisory: 'Acceptable air quality. Sensitive individuals should limit prolonged outdoor exertion.' 
  };
  if (aqi <= 200) return { 
    label: 'Moderate', 
    color: '#eab308', 
    advisory: 'Moderate air quality. Sensitive groups should reduce prolonged outdoor exertion.' 
  };
  if (aqi <= 300) return { 
    label: 'Poor', 
    color: '#f97316', 
    advisory: 'Poor air quality. Avoid outdoor activities. Use N95 mask if going outside.' 
  };
  if (aqi <= 400) return { 
    label: 'Very Poor', 
    color: '#ef4444', 
    advisory: 'Very poor air quality. Stay indoors. Use air purifier. N95 mask mandatory.' 
  };
  return { 
    label: 'Severe', 
    color: '#a855f7', 
    advisory: 'Severe air quality. Avoid all outdoor activities. Emergency shelter recommended.' 
  };
}

// Legacy export for backward compatibility (2-param version)
export function calculateNAQILegacy(
  pm25: number, 
  pm10: number,
  no2: number = -1,
  o3: number = -1
): number {
  return calculateIndianNAQI({
    pm25: pm25 >= 0 ? pm25 : undefined,
    pm10: pm10 >= 0 ? pm10 : undefined,
    no2: no2 >= 0 ? no2 : undefined,
    o3: o3 >= 0 ? o3 : undefined,
  });
}
