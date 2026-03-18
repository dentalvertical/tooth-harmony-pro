import type { ToothData, ToothStatus } from './types';

export const generateDentalChart = (): ToothData[] => {
  const teeth: ToothData[] = [];
  const statuses: ToothStatus[] = ['healthy', 'cavity', 'filled', 'missing', 'implant'];

  for (let i = 1; i <= 32; i++) {
    const rand = Math.random();
    let status: ToothStatus = 'healthy';
    if (rand > 0.7) status = statuses[Math.floor(Math.random() * 5)];

    teeth.push({
      id: i,
      status,
      procedures: status !== 'healthy' ? ['Огляд 15.01.2025'] : [],
    });
  }
  return teeth;
};
