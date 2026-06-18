import {Timestamp} from 'firebase/firestore';

export interface ReceiptItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    assignedTo: Record<string, number>; // map of person IDs to quantity taken
}

export interface Person {
    id: string;
    name: string;
}

export interface Session {
    id: string;
    receiptImageUrl: string | null;
    items: ReceiptItem[];
    persons: Person[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
