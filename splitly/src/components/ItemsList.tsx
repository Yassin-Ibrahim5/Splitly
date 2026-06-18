import {ReceiptItem} from '@/types';
import {useState} from "react";

interface ItemsListProps {
    items: ReceiptItem[];
    onAddItem: (item: { name: string; price: number }) => void;
    onEditItem?: (itemId: string, name: string, price: number) => void;
    onDeleteItem?: (itemId: string) => void;
    onQuantityChange?: (itemId: string, quantity: number) => void;
    currency?: string;
}

export default function ItemsList({
                                      items,
                                      onAddItem,
                                      onEditItem,
                                      currency = 'EGP',
                                      onDeleteItem,
                                      onQuantityChange,
                                  }: ItemsListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingPrice, setEditingPrice] = useState('');
    const [savingWithoutPrice, setSavingWithoutPrice] = useState(false);
    const [savingWithoutName, setSavingWithoutName] = useState(false);
    const handleSaveNewItem = () => {
        const price = parseFloat(newItemPrice);
        if (newItemName.trim() && !isNaN(price)) {
            onAddItem({name: newItemName.trim(), price});
            setIsAdding(false);
            setNewItemName('');
            setNewItemPrice('');
        } else if (isNaN(price) && !newItemName.trim()) {
            setSavingWithoutName(true);
            setSavingWithoutPrice(true);
            console.log("saving without name and price");
        } else if (isNaN(price)) {
            setSavingWithoutPrice(true)
            console.log("saving without price");
        } else if (!newItemName.trim()) {
            setSavingWithoutName(true);
            console.log("saving without name");
        }
    }

    const startEditing = (item: ReceiptItem) => {
        setEditingItemId(item.id);
        setEditingName(item.name);
        setEditingPrice(item.price.toString());
    }

    const handleSaveEdit = (itemId: string) => {
        const price = parseFloat(editingPrice);
        if (editingName.trim() && !isNaN(price) && onEditItem) {
            onEditItem(itemId, editingName.trim(), price);
            setEditingItemId(null);
            setEditingName('');
            setEditingPrice('');
        }
    }

    const handleCancelEdit = () => {
        setEditingItemId(null);
        setEditingName('');
        setEditingPrice('');
    }
    const handleCancelAdd = () => {
        setIsAdding(false);
        setNewItemName('');
        setNewItemPrice('');
    }
    return (
        <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-[13px]">Extracted Items</div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
                >
                    + Add item
                </button>
            </div>

            <div className="flex flex-col gap-2.5">
                {isAdding && (
                    <div
                        className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[10px] px-3.5 py-3 flex items-center gap-3 transition-colors hover:border-[#333]">
                        <input
                            type="text"
                            placeholder="Item name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            className="flex-1 bg-transparent text-[13px] text-[#f0f0f0] outline-none placeholder:text-[#666]"
                            autoFocus
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-[13px] text-[#666]">{currency}</span>
                            <input
                                type="text"
                                placeholder="0.00"
                                value={newItemPrice}
                                onChange={(e) => setNewItemPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveNewItem();
                                    if (e.key === 'Escape') handleCancelAdd();
                                }}
                                className="w-16 bg-transparent text-[13px] text-[#c8f060] font-medium outline-none text-right placeholder:text-[#666]/50"
                            />
                        </div>
                        <div className="flex gap-1.5 ml-1">
                            <button
                                onClick={handleSaveNewItem}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/20 border border-[#c8f060]/40 text-[#c8f060] hover:bg-[#c8f060]/30 transition-colors"
                            >
                                save
                            </button>
                            <button
                                onClick={handleCancelAdd}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-transparent border border-[#444] text-[#999] hover:text-[#ccc] transition-colors"
                            >
                                cancel
                            </button>
                        </div>
                    </div>
                )}

                {items.length === 0 && !isAdding && (
                    <div
                        className="text-center py-6 text-[13px] text-[#666] border border-dashed border-[#2a2a2a] rounded-[10px]">
                        No items yet. Click "+ Add item" to start.
                    </div>
                )}

                {items.map((item) => {
                    if (editingItemId === item.id) {
                        return (
                            <div
                                key={item.id}
                                className="bg-[#1e1e1e] border border-[#c8f060]/50 rounded-[10px] px-3.5 py-3 flex items-center gap-3"
                            >
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="flex-1 bg-transparent text-[13px] text-[#f0f0f0] outline-none placeholder:text-[#666]"
                                    autoFocus
                                />
                                <div className="flex items-center gap-1">
                                    <span className="text-[13px] text-[#666]">{currency}</span>
                                    <input
                                        type="text"
                                        value={editingPrice}
                                        onChange={(e) => setEditingPrice(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(item.id);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        className="w-16 bg-transparent text-[13px] text-[#c8f060] font-medium outline-none text-right"
                                    />
                                </div>
                                <div className="flex gap-1.5 ml-1">
                                    <button
                                        onClick={() => handleSaveEdit(item.id)}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/20 border border-[#c8f060]/40 text-[#c8f060] hover:bg-[#c8f060]/30 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-transparent border border-[#444] text-[#999] hover:text-[#ccc] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={item.id}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-[10px] px-3.5 py-3 flex items-center gap-3 transition-colors hover:border-[#333]"
                        >
                            <div className="flex-1 text-[13px] text-[#f0f0f0]">{item.name}</div>
                            <div className="flex-1 text-[13px] text-[#f0f0f0]">{item.quantity}</div>
                            <div className="text-[13px] text-[#c8f060] font-medium min-w-17.5 text-right flex gap-2">
                                <div onClick={() => {
                                    onQuantityChange?.(item.id, (item.quantity > 1 ? item.quantity - 1 : 0))
                                    if (item.quantity === 1) {
                                        onDeleteItem?.(item.id)
                                    }
                                }}
                                     className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/8 border border-[#c8f060]/20 text-[#c8f060] cursor-pointer whitespace-nowrap">
                                    -
                                </div>
                                {currency} {(item.price) * item.quantity}
                                <div onClick={() => onQuantityChange?.(item.id, (item.quantity || 0) + 1)}
                                     className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/8 border border-[#c8f060]/20 text-[#c8f060] cursor-pointer whitespace-nowrap">
                                    +
                                </div>

                            </div>
                            {onEditItem && (
                                <div
                                    onClick={() => startEditing(item)}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/8 border border-[#c8f060]/20 text-[#c8f060] cursor-pointer whitespace-nowrap"
                                >
                                    Edit
                                </div>
                            )}
                            {onDeleteItem && (
                                <div onClick={() => onDeleteItem(item.id)}
                                     className="text-[10px] px-2 py-0.5 rounded-full bg-[#c8f060]/8 border border-[#c8f060]/20 text-[#c8f060] cursor-pointer whitespace-nowrap">
                                    Delete
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
