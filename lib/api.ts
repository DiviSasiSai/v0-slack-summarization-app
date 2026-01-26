const API_BASE_URL = "https://resentfully-parapsychological-iris.ngrok-free.dev";

export interface WhatsAppMessagePayload {
  device_id: string;
  email: string;
  sender: string;
  message: string;
  time: string;
  date: string;
  group: string;
}

export interface UserMessagePayload {
  device_id: string;
  email: string;
  message: string;
}

export async function sendSlackMessage(payload: WhatsAppMessagePayload) {
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

export async function sendUserMessage(payload: UserMessagePayload) {
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

export async function sendImageMessage(formData: FormData) {
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
