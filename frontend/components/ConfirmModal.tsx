import { LoadingBars } from "@/components/shared/LoadingBars";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

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
    children?: React.ReactNode;
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
    children,
}: ConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isDanger = variant === "danger";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-md bg-background border border-[var(--border-time)] p-6 shadow-2xl rounded-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
                            </div>
                        </div>

                        {children && (
                            <div className="mb-6 px-2">
                                {children}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <motion.button
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {cancelText}
                            </motion.button>
                            <motion.button
                                onClick={onConfirm}
                                disabled={loading}
                                className={`px-4 py-2 text-sm font-bold text-white rounded-lg flex items-center gap-2 transition-all ${isDanger
                                    ? "bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                    : "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                                    }`}
                            >
                                {loading && <LoadingBars className="w-3.5 h-3.5" />}
                                {confirmText}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
