import {ChangeEvent, MouseEvent, useState} from 'react';

interface ReceiptUploaderProps {
    onImageUpload: (file: File) => void;
    onExtract: () => void;
    onRemoveImage: () => void;
    receiptImageUrl: string | null;
    isExtracting: boolean;
    hasExtracted: boolean;
}

export default function ReceiptUploader({
                                            onImageUpload,
                                            onExtract,
                                            onRemoveImage,
                                            receiptImageUrl,
                                            isExtracting,
                                            hasExtracted,
                                        }: ReceiptUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            onImageUpload(file);
        }
    };

    const handleRemoveImage = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setPreviewUrl(null);

        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        onRemoveImage();
    };

    const displayUrl = receiptImageUrl || previewUrl;

    return (
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 relative overflow-hidden">
            <div
                className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#c8f060] to-transparent opacity-40"/>

            <h2 className="font-bold text-[15px] mb-1.5 tracking-tight">Receipt</h2>
            <p className="text-xs text-[#666] mb-5">Upload a photo of your receipt to extract items</p>

            <div
                className={`border-[1.5px] rounded-xl p-9 text-center transition-all relative ${
                    displayUrl
                        ? 'border-solid border-[#60d4f0] p-0 overflow-hidden'
                        : 'border-dashed border-[#2a2a2a] hover:border-[#c8f060] hover:bg-[#c8f060]/3'
                }`}
                onClick={() => !displayUrl && document.getElementById('fileInput')?.click()}
            >
                {displayUrl ? (
                    <div className="space-y-4">
                        <img
                            src={displayUrl}
                            alt="Receipt"
                            className="w-full rounded-[10px] block max-h-60 object-cover"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="text-sm text-[#f06060] cursor-pointer hover:text-[#ff7070] mt-4"
                        >
                            Remove Image
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-[32px] mb-3 opacity-50">🧾</div>
                        <div className="text-[13px] text-[#666]">
                            <strong className="text-[#c8f060]">Click to upload</strong> or drag & drop
                        </div>
                        <div className="text-[11px] text-[#666] mt-2 opacity-60">
                            JPG, PNG, HEIC supported
                        </div>
                    </>
                )}
            </div>

            <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            <button
                onClick={onExtract}
                disabled={!displayUrl || isExtracting}
                className="w-full mt-4 bg-[#c8f060] text-[#0d0d0d] py-2.5 px-5 rounded-lg font-medium text-[13px] tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#d8ff6a] hover:enabled:-translate-y-0.5"
            >
                {isExtracting ? (
                    <>
                        <span className="animate-pulse">Extracting items...</span>
                    </>
                ) : hasExtracted ? (
                    <>✓ Re-scan</>
                ) : (
                    <>✦ Scan Receipt</>
                )}
            </button>

            {isExtracting && (
                <div className="mt-3">
                    <div
                        className="h-0.75 bg-linear-to-r from-transparent via-[#c8f060] to-transparent rounded-full animate-[scan_1.5s_ease-in-out_infinite] bg-size-[200%_100%]"/>
                </div>
            )}
        </div>
    );
}
