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
        quantity: number;
    }[];
}

export function calculateSplit(items: ReceiptItem[], persons: Person[]): PersonTotal[] {
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
        const assignedIds = Object.keys(item.assignedTo);
        if (assignedIds.length > 0) {
            if (item.quantity === 1) {
                const splitAmount = item.price / assignedIds.length;
                const effectiveQuantity = 1 / assignedIds.length;
                assignedIds.forEach(personId => {
                    if (totals[personId]) {
                        totals[personId].total += splitAmount;
                        totals[personId].items.push({
                            itemName: item.name,
                            itemPrice: item.price * item.quantity,
                            splitWith: item.assignedTo.length,
                            amountOwed: splitAmount,
                            quantity: effectiveQuantity,
                        });
                    }
                });
                console.log(item.price);
            } else {
                assignedIds.forEach(personId => {
                    const qtyTaken = item.assignedTo[personId];
                    if (totals[personId] && qtyTaken > 0) {
                        const amountOwed = item.price * qtyTaken;
                        totals[personId].total += amountOwed;
                        totals[personId].items.push({
                            itemName: item.name,
                            itemPrice: item.price * item.quantity,
                            splitWith: 1,
                            amountOwed: amountOwed,
                            quantity: qtyTaken,
                        });
                    }
                })
            }
        }
    });

    return Object.values(totals);
}

export function calculateGrandTotal(items: ReceiptItem[]): number {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function calculateAssignedTotal(items: ReceiptItem[]): number {
    return items
        .filter(item => Object.keys(item.assignedTo).length > 0)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateUnassignedTotal(items: ReceiptItem[]): number {
    return items
        .filter(item => Object.keys(item.assignedTo).length === 0)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
}
