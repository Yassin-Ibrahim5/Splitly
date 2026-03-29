import {Person, ReceiptItem} from '@/types';

export interface PersonTotal {
    personId: string;
    personName: string;
    total: number;
    items: {
        itemName: string;
        itemPrice: number;
        splitWith: number;
        amountOwed: number;
    }[];
}

export function calculateSplit(items: ReceiptItem[], persons: Person[]): PersonTotal[] {
    // Initialize totals for each person
    const totals: { [key: string]: PersonTotal } = {};

    persons.forEach(person => {
        totals[person.id] = {
            personId: person.id,
            personName: person.name,
            total: 0,
            items: [],
        };
    });

    // Calculate split for each item
    items.forEach(item => {
        if (item.assignedTo.length > 0) {
            const splitAmount = item.price / item.assignedTo.length;

            item.assignedTo.forEach(personId => {
                if (totals[personId]) {
                    totals[personId].total += splitAmount;
                    totals[personId].items.push({
                        itemName: item.name,
                        itemPrice: item.price,
                        splitWith: item.assignedTo.length,
                        amountOwed: splitAmount,
                    });
                }
            });
        }
    });

    return Object.values(totals);
}

export function calculateGrandTotal(items: ReceiptItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

export function calculateAssignedTotal(items: ReceiptItem[]): number {
    return items
        .filter(item => item.assignedTo.length > 0)
        .reduce((sum, item) => sum + item.price, 0);
}

export function calculateUnassignedTotal(items: ReceiptItem[]): number {
    return items
        .filter(item => item.assignedTo.length === 0)
        .reduce((sum, item) => sum + item.price, 0);
}
