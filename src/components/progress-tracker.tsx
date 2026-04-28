"use client";

import { Flame, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ProgressTrackerProps = {
  total: number;
  due: number;
  mastered: number;
  streak: number;
};

export function ProgressTracker({
  total,
  due,
  mastered,
  streak,
}: ProgressTrackerProps) {
  const percent = total === 0 ? 0 : Math.round((mastered / total) * 100);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Progress</p>
            <h3 className="text-2xl font-semibold text-foreground">
              {percent}% mastered
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="h-4 w-4" /> {streak} day streak
            </span>
          </div>
        </div>
        <Progress value={percent} className="h-2" />
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-500" /> {due} words due today
          </div>
          <div>{total} words in your library</div>
        </div>
      </CardContent>
    </Card>
  );
}
