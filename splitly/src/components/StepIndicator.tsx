interface StepIndicatorProps {
    currentStep: number;
}

const steps = [
    {number: 1, label: 'Upload Receipt'},
    {number: 2, label: 'Add People'},
    {number: 3, label: 'Assign Items'},
    {number: 4, label: 'View Split'},
];

export default function StepIndicator({currentStep}: StepIndicatorProps) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isDone = currentStep > step.number;
                const statusClass = isDone ? 'done' : isActive ? 'active' : '';

                return (
                    <div key={step.number} className="flex items-center">
                        <div className={`flex items-center gap-2.5 text-xs tracking-wide ${
                            isDone ? 'text-[#60d4f0]' : isActive ? 'text-[#c8f060]' : 'text-[#666]'
                        }`}>
                            <div
                                className={`w-6.5 h-6.5 rounded-full border flex items-center justify-center text-[11px] font-medium transition-all ${
                                    isDone
                                        ? 'border-[#60d4f0] text-[#60d4f0] bg-[#60d4f0]/8'
                                        : isActive
                                            ? 'border-[#c8f060] text-[#c8f060] bg-[#c8f060]/8'
                                            : 'border-[#2a2a2a]'
                                }`}>
                                {isDone ? '✓' : step.number}
                            </div>
                            <span className="hidden sm:inline">{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px bg-[#2a2a2a] mx-3 max-w-15 hidden sm:block"/>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
