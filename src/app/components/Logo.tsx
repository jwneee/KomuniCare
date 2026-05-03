import { Heart, Activity } from "lucide-react";

export function Logo({
  className = "",
  size = "md",
  variant = "default",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
}) {
  const sizes = {
    sm: { icon: "w-6 h-6", text: "text-xl" },
    md: { icon: "w-8 h-8", text: "text-2xl" },
    lg: { icon: "w-12 h-12", text: "text-4xl" },
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-red-600 dark:bg-red-500 rounded-xl blur-sm opacity-50" />
        <div className="relative bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 rounded-xl p-2 shadow-lg">
          <Heart className={`${sizes[size].icon} text-white fill-white`} />
          <Activity className={`${sizes[size].icon} text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50`} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`${sizes[size].text} font-bold ${variant === "white" ? "text-white" : "text-red-600 dark:text-red-500"}`}>
          KomuniCare
        </span>
        <span className={`text-xs -mt-1 ${variant === "white" ? "text-white/70" : "text-muted-foreground"}`}>
          Barangay Health and Wellness Platform
        </span>
      </div>
    </div>
  );
}