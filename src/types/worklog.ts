export type PhotoCategory = 'Before' | 'After' | 'Equipment Tag' | 'Issue / Damage' | 'Work Done' | 'Parts / Slip' | 'Other';

export interface WorkPhoto {
  id: string;
  dataUrl: string; // base64 or blob url
  category: PhotoCategory;
  caption: string;
  unitId?: string; // linked unit
  timestamp: string; // ISO string
}

export type UnitStatus = 'Diagnosed' | 'In Progress' | 'Parts Needed' | 'Completed' | 'Tested & Passed' | 'Requires Follow-up';

export interface PartItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
}

export interface UnitDetail {
  id: string;
  unitNumber: string; // e.g. "Unit 402 - Bld B" or "Chiller #2"
  equipmentType: string; // e.g. "Heat Pump 3-Ton", "Subpanel 200A", "Forklift #12"
  location: string; // e.g. "4th Floor West Wing", "Roof Deck B"
  workOrderNumber: string; // e.g. "WO-88219"
  status: UnitStatus;
  workPerformed: string; // Detailed description of labor
  partsUsed: PartItem[];
  technicianNotes?: string;
}

export interface TimeSection {
  startTime: string; // "07:30"
  endTime: string; // "16:00"
  breakMinutes: number; // e.g. 30
  laborCategory: 'Regular Service' | 'Emergency Repair' | 'Scheduled Maintenance' | 'Installation' | 'Inspection' | 'Travel';
  overtimeHours: number; // calculated or manual
  totalHours: number; // net calculated hours
  isClockRunning?: boolean;
  clockInTimestamp?: number;
}

export interface DailyWorkLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: TimeSection;
  units: UnitDetail[];
  photos: WorkPhoto[];
  generalNotes: string;
  weatherConditions?: string;
  safetyCheckCompleted: boolean;
  status: 'Draft' | 'Submitted' | 'Approved';
  supervisorSignature?: {
    signedBy: string;
    signedAt: string;
    signatureDataUrl?: string;
  };
}

export interface WorkerProfile {
  workerName: string;
  workerTitle: string;
  employeeId: string;
  companyName: string;
  companyPhone: string;
  bossName: string;
  bossEmail: string;
  hourlyRate?: number;
  dailyOtThreshold: number; // default 8 hours
}
