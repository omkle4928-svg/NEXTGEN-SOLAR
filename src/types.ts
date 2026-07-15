export type UserRole = 'agent' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  contactNumber?: string;
  isVerified?: boolean;
  agentIdCode?: string;
  createdAt: string;
}

export interface Consumer {
  id: string;
  name: string; // *NAME
  consumerId: string; // *CONSUMER ID
  panNumber: string; // *PAN
  panPhoto: string; // *PAN PHOTO (Base64)
  aadhaarNumber: string; // *AADHAAR
  aadhaarPhoto: string; // *AADHAAR PHOTO (Base64)
  aadhaarPhotoBack?: string; // *AADHAAR PHOTO BACK (Base64)
  contactNumber: string; // *CONTACT NUMBER
  email: string; // *EMAIL
  cibilScore: number; // *CIBIL
  roofType: 'TIN' | 'RCC'; // *ROOF (TIN OR RCC)
  housePhoto: string; // *HOUSE PoHOT
  loadNeeded: '3KV' | '5KV' | '10KV' | '20KV'; // *LOAD NEEDED
  
  // Transfer details (Optional)
  transfer?: string; // TRANSFER
  reason?: string; // REASON
  transferFromRelation?: string; // IF TRANSFER, FROM (RELATION)
  transferFromName?: string; // TRANSFER FROM NAME
  transferTo?: string; // IF TRANSFER TO

  status: 'Pending' | 'Applied' | 'Transfer Pending' | 'Transfer Applied' | 'Quotation' | 'Loan' | 'Installed' | 'Completed' | 'Approved' | 'Rejected' | 'In Progress'; // *STATUS
  date: string; // *DATE (Form date)
  bank: string; // *BANK
  accountNo?: string; // ACCOUNT NO
  ifsc?: string; // IFSC
  address: string; // *ADDRESS
  landmark: string; // *landmark
  district: string; // *DIS
  pin: string; // *PIN
  loanAmount: number; // *LOAN AMOUNT
  remark?: string; // REMARK
  passbookPhoto?: string; // Bank passbook photo (Optional)

  agentId: string; // Submitted by Agent ID
  agentName: string; // Submitted by Agent Name
  createdAt: string;
}
