"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Plus,
  Clock,
  Hash,
  Calendar,
  Trash2,
  CheckCircle2,
  Circle,
  Lock,
} from "lucide-react";

export function RemindersView() {
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    channels,
    selectedChannel,
  } = useAppStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    channelId: selectedChannel?.id || "",
    dueDate: "",
    dueTime: "09:00",
  });

  const pendingReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  const handleCreateReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) return;

    const channel = channels.find((c) => c.id === newReminder.channelId);

    const reminder: Reminder = {
      id: `reminder_${Date.now()}`,
      title: newReminder.title,
      description: newReminder.description,
      channelId: newReminder.channelId || undefined,
      channelName: channel?.name,
      dueDate: newReminder.dueDate,
      dueTime: newReminder.dueTime,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    addReminder(reminder);
    setNewReminder({
      title: "",
      description: "",
      channelId: "",
      dueDate: "",
      dueTime: "09:00",
    });
    setIsDialogOpen(false);
  };

  const toggleComplete = (id: string, isCompleted: boolean) => {
    updateReminder(id, { isCompleted: !isCompleted });
  };

  const formatDueDate = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "Overdue";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `In ${days} days`;
    return d.toLocaleDateString();
  };

  const getDueBadgeVariant = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "destructive";
    if (days <= 1) return "default";
    return "secondary";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Manage your reminders from Slack discussions
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
              <DialogDescription>
                Set a reminder for yourself based on a Slack discussion
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter reminder title"
                  value={newReminder.title}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, title: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add more details..."
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="channel">Related Channel (optional)</Label>
                <Select
                  value={newReminder.channelId}
                  onValueChange={(value) =>
                    setNewReminder({ ...newReminder, channelId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <span className="flex items-center gap-2">
                          {channel.type === "private" ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Hash className="h-3 w-3" />
                          )}
                          {channel.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Due Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newReminder.dueDate}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, dueDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newReminder.dueTime}
                    onChange={(e) =>
                      setNewReminder({ ...newReminder, dueTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReminder}>Create Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {reminders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-card-foreground">
                  No reminders yet
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                  Create reminders based on action items from your Slack channel
                  summaries.
                </p>
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Pending Reminders */}
              {pendingReminders.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Circle className="h-4 w-4" />
                    Pending ({pendingReminders.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onToggle={toggleComplete}
                        onDelete={deleteReminder}
                        formatDueDate={formatDueDate}
                        getDueBadgeVariant={getDueBadgeVariant}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Reminders */}
              {completedReminders.length > 0 && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed ({completedReminders.length})
                  </h2>
                  <div className="space-y-3">
                    {completedReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onToggle={toggleComplete}
                        onDelete={deleteReminder}
                        formatDueDate={formatDueDate}
                        getDueBadgeVariant={getDueBadgeVariant}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ReminderCard({
  reminder,
  onToggle,
  onDelete,
  formatDueDate,
  getDueBadgeVariant,
}: {
  reminder: Reminder;
  onToggle: (id: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  formatDueDate: (date: string, time: string) => string;
  getDueBadgeVariant: (date: string, time: string) => "default" | "destructive" | "secondary";
}) {
  return (
    <Card
      className={
        reminder.isCompleted ? "bg-muted/30" : "border-border bg-card"
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={reminder.isCompleted}
            onCheckedChange={() => onToggle(reminder.id, reminder.isCompleted)}
            className="mt-1"
          />
          <div className="flex-1">
            <CardTitle
              className={`text-base ${reminder.isCompleted ? "text-muted-foreground line-through" : "text-card-foreground"}`}
            >
              {reminder.title}
            </CardTitle>
            {reminder.description && (
              <CardDescription className="mt-1">
                {reminder.description}
              </CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(reminder.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pl-10">
        <div className="flex items-center gap-3">
          {reminder.channelName && (
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              {reminder.channelName}
            </Badge>
          )}
          <Badge
            variant={
              reminder.isCompleted
                ? "secondary"
                : getDueBadgeVariant(reminder.dueDate, reminder.dueTime)
            }
            className="gap-1"
          >
            <Calendar className="h-3 w-3" />
            {formatDueDate(reminder.dueDate, reminder.dueTime)}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {reminder.dueTime}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
