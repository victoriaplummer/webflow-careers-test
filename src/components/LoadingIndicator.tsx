import { useEffect, useState } from "react";

export function LoadingIndicator() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          clearInterval(interval);
          return 70;
        }
        return prev + Math.random() * 10;
      });
    }, 100);

    // Complete loading when page is fully loaded
    const handleLoad = () => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    };

    window.addEventListener("load", handleLoad);

    // Fallback timeout
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 3000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("load", handleLoad);
      clearTimeout(timeout);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-1 bg-primary/20 z-50 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
