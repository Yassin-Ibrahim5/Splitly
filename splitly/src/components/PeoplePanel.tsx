import {useState } from 'react';
import { Person } from '@/types';
import { KeyboardEvent } from 'react';
interface PeoplePanelProps {
  persons: Person[];
  onAddPerson: (name: string) => void;
  onRemovePerson: (personId: string) => void;
  onSplitEvenly?: () => void;
  showSplitEvenly?: boolean;
}

const COLORS = ['#c8f060', '#60d4f0', '#f0a060', '#c060f0', '#f06090', '#60f0b8'];

export default function PeoplePanel({
  persons,
  onAddPerson,
  onRemovePerson,
  onSplitEvenly,
  showSplitEvenly,
}: PeoplePanelProps) {
  const [newPersonName, setNewPersonName] = useState('');

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      onAddPerson(newPersonName.trim());
      setNewPersonName('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPerson();
    }
  };

  const quickAdd = (name: string) => {
    onAddPerson(name);
  };

  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#c8f060] to-transparent opacity-40" />

      <h2 className="font-['Syne'] font-bold text-[15px] mb-1.5 tracking-tight">People</h2>
      <p className="text-xs text-[#666] mb-5">Who&apos;s splitting this bill?</p>

      {/* Input Row */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a name..."
          className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 font-['DM_Mono'] text-[13px] text-[#f0f0f0] outline-none transition-colors focus:border-[#c8f060] placeholder:text-[#666]"
        />
        <button
          onClick={handleAddPerson}
          className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3.5 py-2.5 text-[#c8f060] text-lg cursor-pointer transition-all hover:border-[#c8f060] hover:bg-[#c8f060]/6"
        >
          +
        </button>
      </div>

      {/* People Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {persons.length === 0 ? (
          <div className="text-center py-4 text-[#666] text-xs w-full">
            No people added yet
          </div>
        ) : (
          persons.map((person, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <div
                key={person.id}
                className="flex items-center gap-1.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full px-3 py-1.5 text-xs"
              >
                <div
                  className="w-1.75 h-1.75 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {person.name}
                <span
                  onClick={() => onRemovePerson(person.id)}
                  className="cursor-pointer text-[#666] text-sm leading-none ml-0.5 hover:text-[#f06060]"
                >
                  ×
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add */}
      <div className="mt-2">
        <div className="text-[11px] text-[#666] mb-2">Quick add</div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => quickAdd('You')}
            className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
          >
            + You
          </button>
          <button
            onClick={() => quickAdd('Friend')}
            className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
          >
            + Friend
          </button>
          <button
            onClick={() => quickAdd('Partner')}
            className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
          >
            + Partner
          </button>
        </div>
      </div>

      {/* Split Evenly */}
      {showSplitEvenly && onSplitEvenly && (
        <div className="mt-5 pt-5 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex-1 text-xs text-[#666]">Split everything evenly?</div>
            <button
              onClick={onSplitEvenly}
              className="bg-transparent text-[#666] border border-[#2a2a2a] text-[11px] px-3 py-1.5 rounded-lg transition-all hover:border-[#c8f060] hover:text-[#c8f060]"
            >
              Split evenly
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
