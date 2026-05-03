import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";

export function KeyboardShortcuts({ userType }: { userType: "resident" | "bhw" }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when Ctrl/Cmd + key is pressed
      if (!e.ctrlKey && !e.metaKey) return;

      // Prevent default for our shortcuts
      const shortcuts: Record<string, () => void> = {
        k: () => {
          e.preventDefault();
          toast.info("Search feature - Coming soon!");
        },
        h: () => {
          e.preventDefault();
          navigate(`/${userType}/dashboard`);
        },
      };

      if (userType === "resident") {
        shortcuts["l"] = () => {
          e.preventDefault();
          navigate("/resident/log-health");
        };
        shortcuts["r"] = () => {
          e.preventDefault();
          navigate("/resident/health-records");
        };
      }

      const handler = shortcuts[e.key.toLowerCase()];
      if (handler) handler();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate, userType]);

  return null;
}
