
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    loading = false,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const isDanger = variant === "danger";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card border border-zinc-800 p-6 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-all hover:-translate-y-[1px] ${isDanger
                            ? "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                            : "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                            }`}
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
