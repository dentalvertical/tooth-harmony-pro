export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'assistant';
  phone: string;
}
