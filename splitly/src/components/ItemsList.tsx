import {ReceiptItem} from '@/types';

interface ItemsListProps {
    items: ReceiptItem[];
    onAddItem: () => void;
    onEditItem?: (itemId: string) => void;
    currency?: string;
}

export default function ItemsList({
                                      items,
                                      onAddItem,
                                      onEditItem,
                                      currency = 'EGP',
                                  }: ItemsListProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
                <div className="font-['Syne'] font-bold text-[13px]">Extracted Items</div>
                <button
                    onClick={onAddItem}
                    className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
                >
                    + Add item
                </button>
            </div>

            <div className="flex flex-col gap-2.5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[10px] px-3.5 py-3 flex items-center gap-3 transition-colors hover:border-[#333]"
                    >
                        <div className="flex-1 text-[13px] text-[#f0f0f0]">{item.name}</div>
                        <div className="text-[13px] text-[#c8f060] font-medium min-w-17.5 text-right">
                            {currency} {item.price.toFixed(2)}
                        </div>
                        {onEditItem && (
                            <div
                                onClick={() => onEditItem(item.id)}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/8 border border-[#c8f060]/20 text-[#c8f060] cursor-pointer whitespace-nowrap"
                            >
                                edit
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
