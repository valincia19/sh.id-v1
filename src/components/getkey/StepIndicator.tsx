"use client";

interface StepIndicatorProps {
    currentStage: "start" | "checkpoints" | "captcha" | "key";
    hasCheckpoints: boolean;
    hasCaptcha: boolean;
}

export default function StepIndicator({ currentStage, hasCheckpoints, hasCaptcha }: StepIndicatorProps) {
    const stages: string[] = ["start"];
    if (hasCaptcha) stages.push("captcha");
    if (hasCheckpoints) stages.push("checkpoints");
    stages.push("key");

    const currentIndex = stages.indexOf(currentStage);
    const total = stages.length;

    const stageLabels: Record<string, string> = {
        start: "Start",
        checkpoints: "Ads",
        captcha: "Verify",
        key: "Key"
    };

    return (
        <div className="w-full mb-8">
            <div className="flex items-center justify-between">
                {stages.map((stage, i) => (
                    <div key={stage} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-semibold transition-all ${i === currentIndex
                                        ? "bg-[#10B981] text-white"
                                        : i < currentIndex
                                            ? "bg-[#10B981]/20 text-[#10B981]"
                                            : "bg-white/[0.04] text-offgray-600 border border-white/[0.06]"
                                    }`}
                            >
                                {i + 1}
                            </div>
                            <span className={`text-[9px] font-mono uppercase tracking-wider ${i === currentIndex
                                    ? "text-offgray-200"
                                    : i < currentIndex
                                        ? "text-[#10B981]"
                                        : "text-offgray-600"
                                }`}>
                                {stageLabels[stage]}
                            </span>
                        </div>
                        {i < total - 1 && (
                            <div className={`flex-1 h-px mx-2 ${i < currentIndex ? "bg-[#10B981]/40" : "bg-white/[0.04]"
                                }`} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
