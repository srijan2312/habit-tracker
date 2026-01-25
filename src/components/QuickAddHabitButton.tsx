import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QuickAddHabitButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    variant="default"
    size="icon"
    className="bg-accent hover:bg-accent/80 text-accent-foreground shadow"
    aria-label="Quick Add Habit"
    onClick={e => { e.stopPropagation(); onClick(); }}
    title="Quick Add Habit"
  >
    <Plus className="h-5 w-5" />
  </Button>
);
