export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'superuser' | 'administrator' | 'doctor';
  phone: string;
}
