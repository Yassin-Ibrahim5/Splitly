import {Person, ReceiptItem} from '@/types';

interface AssignmentGridProps {
    items: ReceiptItem[];
    persons: Person[];
    onToggleAssignment: (itemId: string, personId: string) => void;
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

            <h2 className="font-['Syne'] font-bold text-[15px] mb-1.5 tracking-tight">
                Assign Items
            </h2>
            <p className="text-xs text-[#666] mb-5">
                Tap a person&apos;s name to assign them an item. Multiple people = split cost.
            </p>

            <div className="grid gap-2.5">
                {items.map((item) => {
                    const splitCount = item.assignedTo.length;

                    return (
                        <div
                            key={item.id}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[10px] px-4 py-3.5 flex items-center gap-4 transition-colors hover:border-[#333]"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="text-[13px] text-[#f0f0f0]">{item.name}</div>
                                    {splitCount > 1 && (
                                        <span className="text-[10px] text-[#666]">÷ {splitCount}</span>
                                    )}
                                </div>
                                <div className="text-[11px] text-[#c8f060] mt-0.5">
                                    {currency} {item.price.toFixed(2)}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {persons.map((person, index) => {
                                    const isAssigned = item.assignedTo.includes(person.id);
                                    const color = COLORS[index % COLORS.length];

                                    return (
                                        <button
                                            key={person.id}
                                            onClick={() => onToggleAssignment(item.id, person.id)}
                                            className={`px-3 py-1.5 rounded-full border text-[11px] cursor-pointer transition-all font-['DM_Mono'] ${
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
                                            {person.name}
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
