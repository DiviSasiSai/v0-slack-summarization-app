"""
FastAPI Agent Example for SlackSum Chrome Notifications

This is an example FastAPI server that your Next.js app calls to process
Slack messages and send Chrome push notifications.

Environment Variables Required:
- NEXT_APP_URL: Your Next.js app URL (e.g., https://your-app.vercel.app)
- AGENT_API_KEY: Optional API key for securing the push notification endpoint

Endpoints your agent should implement:
1. POST /api/agent - Process Slack messages and return a summary
2. Optionally call the Next.js push notification endpoint to send notifications
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os

app = FastAPI(title="SlackSum Agent API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NEXT_APP_URL = os.getenv("NEXT_APP_URL", "http://localhost:3000")
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "")


class AgentRequest(BaseModel):
    """Request from Next.js app to process Slack messages"""
    user_id: str  # Slack user ID (unique per user)
    team_id: str  # Slack team ID
    channel_id: str
    channel_name: str
    messages: str  # Formatted messages string
    user_query: str
    device_id: Optional[str] = None  # Chrome device ID for notifications
    slack_access_token: Optional[str] = None


class AgentResponse(BaseModel):
    """Response to Next.js app"""
    response: str  # The AI-generated summary/response
    shouldNotify: bool = False  # Whether to send a push notification
    notificationTitle: Optional[str] = None
    notificationBody: Optional[str] = None


class PushNotificationRequest(BaseModel):
    """Request to send a push notification to a user's Chrome browser"""
    user_id: str  # Slack user ID
    device_id: Optional[str] = None  # Specific device, or all devices if None
    title: str
    body: str
    url: Optional[str] = "/dashboard"
    data: Optional[dict] = None


# Store conversation context per user (use Redis/DB in production)
user_contexts: dict = {}


def get_user_context(user_id: str, team_id: str) -> list:
    """Get conversation context for a specific user"""
    key = f"{team_id}:{user_id}"
    if key not in user_contexts:
        user_contexts[key] = []
    return user_contexts[key]


def add_to_context(user_id: str, team_id: str, role: str, content: str):
    """Add a message to user's conversation context"""
    key = f"{team_id}:{user_id}"
    if key not in user_contexts:
        user_contexts[key] = []
    user_contexts[key].append({"role": role, "content": content})
    # Keep only last 20 messages
    user_contexts[key] = user_contexts[key][-20:]


@app.post("/api/agent", response_model=AgentResponse)
async def process_messages(request: AgentRequest):
    """
    Process Slack messages and generate an AI response.
    
    This endpoint is called by the Next.js app when:
    1. User clicks "Fetch & Summarize" button
    2. User sends a message in the chat
    
    The user_id and team_id ensure context isolation between users.
    """
    try:
        # Get user's conversation context (isolated per user)
        context = get_user_context(request.user_id, request.team_id)
        
        # Build the prompt for your AI model
        system_prompt = f"""You are an AI assistant that helps summarize Slack channel conversations.
You are currently analyzing messages from the #{request.channel_name} channel.
Be concise, highlight action items, and mention important decisions.
Format your response with markdown for better readability."""

        # Add the new messages to context
        if request.messages:
            add_to_context(
                request.user_id, 
                request.team_id, 
                "user", 
                f"New messages from #{request.channel_name}:\n{request.messages}\n\nUser query: {request.user_query}"
            )
        else:
            add_to_context(
                request.user_id, 
                request.team_id, 
                "user", 
                request.user_query
            )

        # TODO: Replace this with your actual AI model call
        # Example with OpenAI:
        # from openai import OpenAI
        # client = OpenAI()
        # response = client.chat.completions.create(
        #     model="gpt-4",
        #     messages=[
        #         {"role": "system", "content": system_prompt},
        #         *context
        #     ]
        # )
        # ai_response = response.choices[0].message.content

        # Placeholder response (replace with your AI logic)
        ai_response = generate_placeholder_response(request)
        
        # Add AI response to context
        add_to_context(request.user_id, request.team_id, "assistant", ai_response)
        
        # Determine if we should send a notification
        # (e.g., if there are important action items)
        should_notify = "action item" in ai_response.lower() or "urgent" in ai_response.lower()
        
        return AgentResponse(
            response=ai_response,
            shouldNotify=should_notify,
            notificationTitle=f"Update from #{request.channel_name}" if should_notify else None,
            notificationBody="New action items detected" if should_notify else None,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def generate_placeholder_response(request: AgentRequest) -> str:
    """Generate a placeholder response. Replace with your actual AI logic."""
    if not request.messages:
        return f"I don't have any new messages to analyze from #{request.channel_name}. Click 'Fetch & Summarize' to get the latest messages."
    
    message_count = request.messages.count('\n') + 1
    return f"""**Summary of {message_count} messages in #{request.channel_name}:**

Based on the recent conversation, here are the key points:

**Key Discussions:**
- Team members discussed various topics in the channel
- Several updates were shared

**Action Items:**
- Review the full conversation for specific tasks
- Follow up on any pending items

**Note:** This is a placeholder response. Connect your AI model for actual summarization.

---
*Query: {request.user_query}*"""


@app.post("/send-notification")
async def send_push_notification(request: PushNotificationRequest):
    """
    Send a push notification to a user's Chrome browser.
    
    Call this endpoint when you want to proactively notify a user
    (e.g., when processing messages in the background and finding something important).
    
    The notification will be sent to ALL devices registered for this user,
    or to a specific device if device_id is provided.
    """
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Content-Type": "application/json"}
            if AGENT_API_KEY:
                headers["Authorization"] = f"Bearer {AGENT_API_KEY}"
            
            response = await client.post(
                f"{NEXT_APP_URL}/api/push/send",
                json={
                    "user_id": request.user_id,
                    "device_id": request.device_id,
                    "title": request.title,
                    "body": request.body,
                    "url": request.url,
                    "data": request.data or {},
                },
                headers=headers,
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to send notification: {response.text}"
                )
            
            return response.json()
    
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Example: Background task to periodically check for important messages
# and send notifications
async def background_notification_example(user_id: str, channel_name: str, message: str):
    """
    Example of how to send a notification from a background task.
    
    You might call this when:
    - Processing Slack events via webhooks
    - Running periodic checks for important messages
    - Detecting urgent keywords in messages
    """
    notification = PushNotificationRequest(
        user_id=user_id,
        title=f"Important: #{channel_name}",
        body=message[:100],  # First 100 chars
        url=f"/dashboard?channel={channel_name}",
    )
    await send_push_notification(notification)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
