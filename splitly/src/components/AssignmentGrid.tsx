import {Person, ReceiptItem} from '@/types';

interface AssignmentGridProps {
    items: ReceiptItem[];
    persons: Person[];
    onToggleAssignment: (itemId: string, personId: string, quantityTaken: number) => void;
    currency?: string;
}

const COLORS = ['#c8f060', '#60d4f0', '#f0a060', '#c060f0', '#f06090', '#60f0b8'];

export default function AssignmentGrid({
                                           items,
                                           persons,
                                           onToggleAssignment,
                                           currency = 'EGP',
                                       }: AssignmentGridProps) {
    if (items.length === 0 || persons.length === 0) {
        return null;
    }

    return (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden col-span-full">
            <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#c8f060] to-transparent opacity-40"/>

            <h2 className="font-bold text-[15px] mb-1.5 tracking-tight">
                Assign Items
            </h2>
            <p className="text-xs text-[#666] mb-5">
                Tap a person&apos;s name to assign them an item. Multiple people = split cost.
            </p>

            <div className="grid gap-2.5">
                {items.map((item) => {
                    const assignedPersons = Object.keys(item.assignedTo);
                    const splitCount = item.assignedTo.length;
                    const totalClaimed = Object.values(item.assignedTo).reduce((sum, quantity) => sum + quantity, 0);

                    return (
                        <div
                            key={item.id}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[10px] px-4 py-3.5 flex items-center gap-4 transition-colors hover:border-[#333]"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="text-[13px] text-[#f0f0f0]">{item.name} <span className='text-[#666] text-[11px]'>x {item.quantity}</span></div>
                                    {splitCount > 1 && (
                                        <span className="text-[10px] text-[#666]">÷ {splitCount}</span>
                                    )}
                                </div>
                                <div className="text-[11px] text-[#c8f060] mt-0.5">
                                    {currency} {item.price * item.quantity}
                                </div>
                                {totalClaimed > item.quantity && (
                                    <div className="text-[10px] text-[#f06060] mt-0.5">
                                        Over-assigned!
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {persons.map((person, index) => {
                                    const qtyAssigned = item.assignedTo[person.id] || 0;
                                    const isAssigned = qtyAssigned > 0;
                                    const color = COLORS[index % COLORS.length];

                                    const handleTap = () => {
                                        let nextQty;
                                        if (item.quantity === 1) {
                                            nextQty = isAssigned ? 0 : 1;
                                        } else {
                                            nextQty = qtyAssigned + 1;
                                            if (nextQty > item.quantity) {
                                                nextQty = 0;
                                            }
                                        }
                                        onToggleAssignment(item.id, person.id, nextQty);
                                    }
                                    return (
                                        <button
                                            key={person.id}
                                            onClick={handleTap}
                                            className={`px-3 py-1.5 rounded-full border text-[11px] cursor-pointer transition-all ${
                                                isAssigned
                                                    ? 'border-opacity-100 bg-opacity-8'
                                                    : 'border-[#2a2a2a] text-[#666] bg-transparent'
                                            }`}
                                            style={
                                                isAssigned
                                                    ? {
                                                        borderColor: color,
                                                        color: color,
                                                        backgroundColor: `${color}18`,
                                                    }
                                                    : {}
                                            }
                                        >
                                            {person.name} {qtyAssigned > 1 && `(${qtyAssigned})`}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
