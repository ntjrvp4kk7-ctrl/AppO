export interface UnitPhoto {
  id: string;
  dataUrl: string;
  type: 'before' | 'after';
  timestamp: string;
  caption?: string;
}

export interface UnitWork {
  id: string;
  unitNumber: string; // e.g. "Unit 304", "Apt 12B"
  paintColor?: string; // e.g. "Agreeable Gray", "Swiss Coffee"
  notes?: string; // e.g. "Patched small hole behind door, painted living room, cleaned floor"
  photos: UnitPhoto[];
  isCompleted: boolean;
}

export interface TimeSection {
  startTime: string; // "07:30"
  endTime: string; // "16:00"
  lunchDeductionMinutes: number; // e.g. 30
  totalHours: number;
  overtimeHours: number;
}

export interface DailyWorkLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: TimeSection;
  units: UnitWork[];
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
}
