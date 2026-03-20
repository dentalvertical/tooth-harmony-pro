import type { StaffMember } from "./types";

export const mockStaff: StaffMember[] = [
  { id: "1", name: "Олександр Іваненко", email: "ivanenko@clinic.com", role: "doctor", phone: "+380501111111" },
  { id: "2", name: "Вікторія Коваль", email: "koval@clinic.com", role: "doctor", phone: "+380502222222" },
  { id: "3", name: "Анна Сидоренко", email: "admin@clinic.com", role: "administrator", phone: "+380503333333" },
  { id: "4", name: "Системний суперюзер", email: "superuser@clinic.local", role: "superuser", phone: "+380504444444" },
];
