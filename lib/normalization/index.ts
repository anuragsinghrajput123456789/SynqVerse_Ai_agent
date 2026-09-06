/**
 * Normalization Module
 * Safe, deterministic string & plate format normalizers.
 */

export function normalizeVehicleReg(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === '' || trimmed.includes('?') || trimmed.includes('UNKNOWN')) {
    return '';
  }

  const clean = trimmed.replace(/[\s\-]+/g, '');

  // Match fleet ID: MF-068 / MF068
  const mfMatch = clean.match(/^MF(\d+)$/);
  if (mfMatch) {
    return `MF-${mfMatch[1].padStart(3, '0')}`;
  }

  // Match truck ID: TRK104 / TRUCK104 / TRK-104
  const trkMatch = clean.match(/^(?:TRK|TRUCK)(\d+)$/);
  if (trkMatch) {
    return `TRK-${trkMatch[1].padStart(3, '0')}`;
  }

  // Match Indian License Plate: 2 letters + 2 digits + 1-3 letters + 1-4 digits
  const plateMatch = clean.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{1,4})$/);
  if (plateMatch) {
    const [, state, dist, series, num] = plateMatch;
    return `${state}${dist}${series}${num.padStart(4, '0')}`;
  }

  return clean;
}

export function normalizeDriverId(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim().toUpperCase().replace(/[\s\-]+/g, '');
  const match = clean.match(/^DRV(\d+)$/);
  if (match) {
    return `DRV-${match[1].padStart(3, '0')}`;
  }
  return clean;
}

export function normalizeClientName(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return 'Internal';
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('shakti')) return 'Shakti Cement';
  if (lower.includes('vertex')) return 'Vertex Retail';
  if (lower.includes('apex')) return 'Apex Chemicals';
  if (lower.includes('orion')) return 'Orion Pharma';
  if (lower.includes('internal')) return 'Internal';

  return clean;
}

export function normalizeStatus(raw: string | undefined | null): string {
  if (!raw || typeof raw !== 'string') return 'Unknown';
  const lower = raw.trim().toLowerCase();

  if (lower === 'active') return 'Active';
  if (lower === 'grounded') return 'Grounded';
  if (lower.includes('maint')) return 'Maintenance';
  if (lower === 'closed') return 'Closed';
  if (lower === 'open' || lower === 'pending') return 'Open';

  return raw.trim();
}
