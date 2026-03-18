export type ToothStatus = 'healthy' | 'cavity' | 'filled' | 'missing' | 'implant';

export interface ToothData {
  id: number;
  status: ToothStatus;
  procedures: string[];
}
