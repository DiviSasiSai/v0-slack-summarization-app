"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  X,
  Bell,
  Clock,
  Hash,
  Check,
  Trash2,
  Sparkles,
} from "lucide-react";

export function NotificationsPanel() {
  const {
    reminders,
    markReminderRead,
    markReminderComplete,
    deleteReminder,
    setShowNotifications,
  } = useAppStore();

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  const handleClose = () => {
    // Mark all as read when closing
    activeReminders.forEach((r) => {
      if (!r.isRead) {
        markReminderRead(r.id);
      }
    });
    setShowNotifications(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Reminders</h2>
            {activeReminders.length > 0 && (
              <Badge variant="secondary">{activeReminders.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-60px)]">
          <div className="p-4">
            {reminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-medium text-foreground">
                  No reminders yet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The AI will automatically create reminders from your Slack
                  conversations
                </p>
              </div>
            ) : (
              <>
                {/* Active Reminders */}
                {activeReminders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      Active
                    </h3>
                    <div className="space-y-3">
                      {activeReminders.map((reminder) => (
                        <Card
                          key={reminder.id}
                          className={`transition-all ${!reminder.isRead ? "border-primary/50 bg-primary/5" : ""}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">
                                    {reminder.title}
                                  </h4>
                                  {reminder.source === "auto" && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Sparkles className="mr-1 h-3 w-3" />
                                      Auto
                                    </Badge>
                                  )}
                                  {!reminder.isRead && (
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {reminder.description}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {reminder.channelName && (
                                    <span className="flex items-center gap-1">
                                      <Hash className="h-3 w-3" />
                                      {reminder.channelName}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {reminder.dueDate} at {reminder.dueTime}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-primary hover:bg-primary/10"
                                  onClick={() => markReminderComplete(reminder.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteReminder(reminder.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Reminders */}
                {completedReminders.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                      Completed
                    </h3>
                    <div className="space-y-3">
                      {completedReminders.map((reminder) => (
                        <Card
                          key={reminder.id}
                          className="border-border/50 bg-muted/30 opacity-75"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-muted-foreground line-through">
                                  {reminder.title}
                                </h4>
                                <p className="mt-1 text-sm text-muted-foreground/70">
                                  {reminder.description}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
