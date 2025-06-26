export interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
  z6?: number; // Only for power zones 6 & 7
  z7?: number;
}

function initZones(includeHighZones = false): ZoneDistribution {
  return includeHighZones
    ? { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0 }
    : { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
}

/**
 * Compute time (in seconds) spent in each Coggan power zone (Z1–Z7)
 */
export function computeTimeInPowerZones(wattsArray: number[], ftp: number): ZoneDistribution {
  const zones = initZones(true);
  if (!ftp || ftp <= 0) return zones;

  for (const w of wattsArray) {
    if (w < 0.55 * ftp) zones.z1++;
    else if (w < 0.75 * ftp) zones.z2++;
    else if (w < 0.9 * ftp) zones.z3++;
    else if (w < 1.05 * ftp) zones.z4++;
    else if (w < 1.2 * ftp) zones.z5++;
    else if (w < 1.5 * ftp) zones.z6!++;
    else zones.z7!++;
  }

  return zones;
}

/**
 * Compute time (in seconds) in heart-rate zones (based on %LTHR, 5 zones)
 * Z6/Z7 remain undefined.
 */
export function computeTimeInHrZones(hrArray: number[], lthr: number): ZoneDistribution {
  const zones = initZones(false);
  if (!lthr || lthr <= 0) return zones;

  for (const hr of hrArray) {
    if (hr < 0.68 * lthr) zones.z1++;
    else if (hr < 0.83 * lthr) zones.z2++;
    else if (hr < 0.94 * lthr) zones.z3++;
    else if (hr < 1.03 * lthr) zones.z4++;
    else zones.z5++;
  }

  return zones;
} 