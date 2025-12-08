// /types/user.ts (MODIFIED)

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  LOGISTICS = 'LOGISTICS',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  address: string;
  wallet_balance: number;
  password?: string;
}
