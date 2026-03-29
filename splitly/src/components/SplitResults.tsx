"use client";

import {Person, ReceiptItem} from '@/types';
import {calculateSplit} from '@/lib/split';

interface SplitResultsProps {
    items: ReceiptItem[];
    persons: Person[];
    currency?: string;
    onShare?: () => void;
}

const COLORS = ['#c8f060', '#60d4f0', '#f0a060', '#c060f0', '#f06090', '#60f0b8'];

export default function SplitResults({
                                         items,
                                         persons,
                                         currency = 'EGP',
                                         onShare,
                                     }: SplitResultsProps) {
    if (persons.length === 0) {
        return null;
    }

    const results = calculateSplit(items, persons);

    return (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden col-span-full">
            <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#c8f060] to-transparent opacity-40"/>

            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="font-['Syne'] font-bold text-[15px] mb-0 tracking-tight">
                        Final Split
                    </h2>
                    <p className="text-xs text-[#666] mt-1">Who owes what</p>
                </div>
                {onShare && (
                    <button
                        onClick={onShare}
                        className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
                    >
                        ⬡ Share
                    </button>
                )}
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                {results.map((result, index) => {
                    const color = COLORS[index % COLORS.length];
                    const breakdown = result.items.slice(0, 3);
                    const hasMore = result.items.length > 3;

                    return (
                        <div
                            key={result.personId}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 relative overflow-hidden transition-colors hover:border-[#333]"
                            style={{
                                borderBottomColor: color,
                                borderBottomWidth: '2px',
                            }}
                        >
                            <div
                                className="font-['Syne'] font-bold text-[15px] mb-1"
                                style={{color}}
                            >
                                {result.personName}
                            </div>
                            <div className="text-[11px] text-[#666] mb-3.5">
                                {result.items.length} item{result.items.length !== 1 ? 's' : ''}
                            </div>

                            <div className="font-['Syne'] text-[28px] font-extrabold text-[#c8f060] tracking-tight">
                <span className="text-sm text-[#666] align-super font-['DM_Mono'] font-normal">
                  {currency}{' '}
                </span>
                                {result.total.toFixed(2)}
                            </div>

                            {breakdown.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex flex-col gap-1.5">
                                    {breakdown.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between text-[11px] text-[#666]"
                                        >
                                            <span>{item.itemName}</span>
                                            <span className="text-[#f0f0f0]">
                        {currency} {item.amountOwed.toFixed(2)}
                      </span>
                                        </div>
                                    ))}
                                    {hasMore && (
                                        <div className="flex justify-between text-[11px] text-[#666]">
                                            <span>+{result.items.length - 3} more</span>
                                            <span></span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
