import { Send } from "lucide-react";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/chat/expandable-chat";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import { Messages, Peer } from "./types";
import React from "react";

const ChatInterface = ({ sendWebSocketMessage, messages, user, roomId }: { sendWebSocketMessage: (message: any) => void, messages: Messages[], user: Peer, roomId: string }) => {
  const [input, setInput] = React.useState('');

  const handleSendMessage = (message: string) => {
    const messageObject = {
      id: messages.length + 1,
      message,
      email: user.email,
      timestamp: new Date().toLocaleString(),
      room_id: roomId
    };
    sendWebSocketMessage({ action: 'chat_message', data: messageObject });
    setInput('');
  };

  return (
    <ExpandableChat size="lg" position="bottom-right">
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Party Chat</h1>
        <p>Chat with your watch party members</p>
      </ExpandableChatHeader>
      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.email == user.email ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                fallback={message.email.charAt(0).toUpperCase()}
              />
              <ChatBubbleMessage variant={message.email == user.email ? "sent" : "received"}>
                {message.message}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
        </ChatMessageList>
      </ExpandableChatBody>
      <ExpandableChatFooter className="relative">
        <ChatInput
          placeholder="Type a message..."
          className="pr-12"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-8 top-1/2 -translate-y-1/2"
          onClick={() => handleSendMessage(input)}
        >
          <Send className="w-4 h-4" />
        </Button>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

export default ChatInterface;