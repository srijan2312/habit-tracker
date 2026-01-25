import * as React from "react";

const QUOTES = [
  "Small steps every day lead to big results.",
  "Consistency is the key to success.",
  "You are your only limit.",
  "Progress, not perfection.",
  "Success is the sum of small efforts repeated."
];

export const MotivationalQuote: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="italic text-sm text-accent font-medium transition-opacity duration-500"
      title="Motivational Tip"
    >
      {QUOTES[index]}
    </span>
  );
};
