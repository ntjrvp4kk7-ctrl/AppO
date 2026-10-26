export type PhotoCategory =
  | 'Damage / Hole'
  | 'Before Repair'
  | 'Mud / Patch Progress'
  | 'Texture Match'
  | 'After / Finished'
  | 'Paint Code / Can';

export interface WorkPhoto {
  id: string;
  dataUrl: string;
  category: PhotoCategory;
  caption: string;
  repairId?: string; // links to specific unit repair
  timestamp: string;
}

export type DamageType =
  | 'Doorknob / Fist Hole'
  | 'Water Damage / Ceiling Leak'
  | 'Drywall Stress Crack'
  | 'Corner Bead Dent / Pop'
  | 'Nail Pops / Anchor Holes'
  | 'Peeling Paint / Scrape'
  | 'Large Sheetrock Replacement'
  | 'Other Wall/Ceiling Damage';

export type TextureType =
  | 'Orange Peel (Light)'
  | 'Orange Peel (Medium)'
  | 'Knockdown'
  | 'Smooth / Flat'
  | 'Popcorn Ceiling'
  | 'Custom / Skip Trowel';

export type RepairStage =
  | 'Damage Documented'
  | 'Patched & Taped'
  | 'Mudded & Sanded'
  | 'Texture Matched'
  | 'Primed'
  | 'Painted & Completed';

export interface UnitRepair {
  id: string;
  unitNumber: string; // e.g. "Unit 304", "Apt 12B"
  roomArea: string; // e.g. "Living Room behind door", "Master Bath Ceiling"
  damageType: DamageType;
  damageSize?: string; // e.g. "8 inch hole", "2x3 ft cutout"
  repairStage: RepairStage;
  paintColor: string; // e.g. "SW 7029 Agreeable Gray", "Behr Swiss Coffee"
  paintSheen: 'Flat / Matte' | 'Eggshell' | 'Satin' | 'Semi-Gloss';
  primerUsed?: string; // e.g. "Kilz Stain Blocker", "PVA Primer"
  compoundUsed?: string; // e.g. "Easy Sand 20", "Plus 3 All Purpose"
  textureType: TextureType;
  workDescription: string; // e.g. "Cut out water-damaged sheetrock, installed backing, hung 1/2in sheetrock, taped, 2 coats hot mud, textured, painted 2 coats."
}

export type PaintDrywallLaborActivity =
  | 'Drywall Hanging & Patching'
  | 'Taping & Mudding'
  | 'Sanding & Prep'
  | 'Texture Spray & Blend'
  | 'Priming & Stain Blocking'
  | 'Finish Painting'
  | 'Full Unit Turnover'
  | 'Touch-up & Walkthrough';

export interface TimeSection {
  startTime: string; // "07:30"
  endTime: string; // "16:00"
  breakMinutes: number; // 30
  laborCategory: PaintDrywallLaborActivity;
  overtimeHours: number;
  totalHours: number;
  isClockRunning?: boolean;
  clockInTimestamp?: number;
}

export interface DailyWorkLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: TimeSection;
  repairs: UnitRepair[];
  photos: WorkPhoto[];
  status: 'Draft' | 'Submitted' | 'Approved';
  supervisorSignature?: {
    signedBy: string;
    signedAt: string;
  };
}

export interface UserAccount {
  id: string;
  email: string;
  workerName: string;
  bossName: string;
  bossEmail: string;
  companyName: string;
}
