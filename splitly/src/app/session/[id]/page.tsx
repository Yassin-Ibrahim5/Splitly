'use client';

import {useEffect, useState} from 'react';
import {notFound, useParams} from 'next/navigation';
import {
    addPerson,
    removePerson,
    subscribeToSession,
    toggleItemAssignment,
    updateItems,
    updateReceiptImage
} from '@/lib/session';
import type {ReceiptItem, Session} from '@/types';

import StepIndicator from '@/components/StepIndicator';
import ReceiptUploader from '@/components/ReceiptUploader';
import ItemsList from '@/components/ItemsList';
import PeoplePanel from '@/components/PeoplePanel';
import AssignmentGrid from '@/components/AssignmentGrid';
import SplitResults from '@/components/SplitResults';

export default function SessionPage() {
    const params = useParams();
    const id = params?.id as string;
    const [session, setSession] = useState<Session | null | undefined>(undefined);
    const [isExtracting, setIsExtracting] = useState(false);
    const [hasExtracted, setHasExtracted] = useState(false);

    useEffect(() => {
        if (!id) return;
        const unsub = subscribeToSession(id, (s) => setSession(s));
        return unsub;
    }, [id]);

    if (session === undefined) {
        return (
            <div
                className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-[#666] text-sm"
                style={{fontFamily: "'DM Mono', monospace"}}
            >
                Loading…
            </div>
        );
    }

    if (session === null) return notFound();

    // Derive current step
    const step =
        session.items.length === 0
            ? 1
            : session.persons.length === 0
                ? 2
                : session.items.some((item) => item.assignedTo.length > 0)
                    ? 4
                    : 3;

    const handleImageUpload = async (file: File) => {
        try {
            // Convert to base64 and store directly in Firestore (simpler, no storage issues)
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                await updateReceiptImage(id, base64String);
            };
            reader.onerror = () => {
                console.error('Failed to read file');
                alert('Failed to read image file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleExtract = async () => {
        if (!session.receiptImageUrl) return;

        setIsExtracting(true);
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({imageUrl: session.receiptImageUrl}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Extraction API error:', errorData);

                // Show detailed error to user
                const errorMsg = errorData.details || errorData.error || 'Unknown error';
                alert(`Extraction failed: ${errorMsg}\n\nYou can add items manually using the "+ Add item" button.`);
                setIsExtracting(false);
                return;
            }

            const data = await response.json();
            const extractedItems: ReceiptItem[] = data.items.map((item: any) => ({
                id: Date.now().toString() + Math.random(),
                name: item.name,
                price: item.price,
                assignedTo: [],
            }));

            await updateItems(id, extractedItems);
            setHasExtracted(true);
        } catch (error) {
            console.error('Failed to extract items:', error);
            alert('Failed to extract items from receipt. Use the "+ Add item" button to add items manually.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAddPerson = async (name: string) => {
        await addPerson(id, name);
    };

    const handleRemovePerson = async (personId: string) => {
        await removePerson(id, personId);
    };

    const handleToggleAssignment = async (itemId: string, personId: string) => {
        await toggleItemAssignment(id, itemId, personId);
    };

    const handleSplitEvenly = async () => {
        const updatedItems = session.items.map((item) => ({
            ...item,
            assignedTo: session.persons.map((p) => p.id),
        }));
        await updateItems(id, updatedItems);
    };

    const handleAddItem = (newItemData : {name: string; price: number}) => {
        const newItem: ReceiptItem = {
            id: Date.now().toString(),
            name: newItemData.name,
            price: newItemData.price,
            assignedTo: [],
        }
        updateItems(id, [...session.items, newItem]).then();
    };

    const handleRemoveItem = (itemId: string) => {
        const updatedItems = session.items.filter((item) => item.id !== itemId);
        updateItems(id, updatedItems);
    }

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Session link copied to clipboard!');
        });
    };

    return (
        <div
            className="min-h-screen bg-[#0d0d0d] text-[#f0f0f0]"
            style={{fontFamily: "'DM Mono', monospace"}}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-50 border-b border-[#2a2a2a] px-8 py-4 flex items-center gap-3 bg-[#0d0d0d]/90 backdrop-blur-xl">
        <span
            className="text-[22px] font-extrabold tracking-tight"
            style={{fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px'}}
        >
          <span className="text-[#c8f060]">Split</span>
          <span className="text-[#f0f0f0]">ly</span>
        </span>
                <span
                    className="text-[11px] text-[#666] border border-[#2a2a2a] rounded-full px-2.5 py-0.5 tracking-wider bg-[#1e1e1e]">
          beta
        </span>
                <span className="ml-auto text-[11px] text-[#666] font-mono uppercase tracking-widest">
          {id}
        </span>
            </header>

            {/* Main */}
            <main className="max-w-275 mx-auto px-6 py-10">
                {/* Step Indicator - Full Width */}
                <div className="mb-8">
                    <StepIndicator currentStep={step}/>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Receipt + Items */}
                    <div className="space-y-6">
                        <ReceiptUploader
                            onImageUpload={handleImageUpload}
                            onExtract={handleExtract}
                            onRemoveImage={() => updateReceiptImage(id, null)}
                            receiptImageUrl={session.receiptImageUrl}
                            isExtracting={isExtracting}
                            hasExtracted={hasExtracted}
                        />
                        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#c8f060] to-transparent opacity-40"/>
                            <ItemsList
                                items={session.items}
                                onAddItem={handleAddItem}
                                onDeleteItem={handleRemoveItem}
                                currency="EGP"
                            />
                        </div>
                    </div>

                    {/* Right Column: People */}
                    <PeoplePanel
                        persons={session.persons}
                        onAddPerson={handleAddPerson}
                        onRemovePerson={handleRemovePerson}
                        onSplitEvenly={handleSplitEvenly}
                        showSplitEvenly={session.items.length > 0 && session.persons.length > 0}
                    />

                    {/* Full Width: Assignment Grid */}
                    {session.items.length > 0 && session.persons.length > 0 && (
                        <AssignmentGrid
                            items={session.items}
                            persons={session.persons}
                            onToggleAssignment={handleToggleAssignment}
                            currency="EGP"
                        />
                    )}

                    {/* Full Width: Totals Bar */}
                    {session.items.length > 0 && (
                        <div
                            className="col-span-full bg-[#161616] border border-[#2a2a2a] rounded-xl px-6 py-4 flex gap-8 items-center">
                            <div>
                                <div className="text-[11px] text-[#666] mb-1">SUBTOTAL</div>
                                <div
                                    className="font-bold text-lg"
                                    style={{fontFamily: "'DM Mono', monospace"}}
                                >
                                    EGP {session.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] text-[#666] mb-1">PEOPLE</div>
                                <div
                                    className="font-bold text-lg text-[#60d4f0]"
                                    style={{fontFamily: "'DM Mono', monospace"}}
                                >
                                    {session.persons.length}
                                </div>
                            </div>
                            <div className="ml-auto">
                                <div className="text-[11px] text-[#666] mb-1">ASSIGNED</div>
                                <div
                                    className="font-bold text-lg text-[#c8f060]"
                                    style={{fontFamily: "'DM Mono', monospace"}}
                                >
                                    {session.items.length > 0
                                        ? Math.round(
                                            (session.items.filter((i) => i.assignedTo.length > 0).length /
                                                session.items.length) *
                                            100
                                        )
                                        : 0}
                                    %
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full Width: Results */}
                    {session.persons.length > 0 && (
                        <SplitResults
                            items={session.items}
                            persons={session.persons}
                            currency="EGP"
                            onShare={handleShare}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
