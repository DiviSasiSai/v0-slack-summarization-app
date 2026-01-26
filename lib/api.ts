const API_BASE_URL =
  "https://resentfully-parapsychological-iris.ngrok-free.dev";

// Schema for sending Slack messages to the agent
export interface SlackMessagePayload {
  device_id: string;
  email: string;
  sender: string;
  message: string;
  time: string;
  date: string;
  group: string;
}

// Schema for user queries to the agent
export interface UserMessagePayload {
  device_id: string;
  email: string;
  message: string;
}

// Send a Slack message to the agent for processing
export async function sendSlackMessageToAgent(
  payload: SlackMessagePayload
): Promise<{ response?: string; reminder?: ReminderFromAgent }> {
  const response = await fetch(`${API_BASE_URL}/whatsapp-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Send user's interactive message to the agent
export async function sendUserMessage(
  payload: UserMessagePayload
): Promise<{ response: string; reminder?: ReminderFromAgent }> {
  const response = await fetch(`${API_BASE_URL}/user-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Send an image from Slack to the agent
export async function sendImageToAgent(
  deviceId: string,
  email: string,
  sender: string,
  time: string,
  date: string,
  group: string,
  imageFile: File
): Promise<{ response?: string; reminder?: ReminderFromAgent }> {
  const formData = new FormData();
  formData.append("device_id", deviceId);
  formData.append("email", email);
  formData.append("sender", sender);
  formData.append("time", time);
  formData.append("date", date);
  formData.append("group", group);
  formData.append("image", imageFile);

  const response = await fetch(`${API_BASE_URL}/image-message`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Type for reminders returned from the agent
export interface ReminderFromAgent {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
}
