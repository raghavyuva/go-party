import React, { createContext, useContext, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MediaPlayerInstance } from '@vidstack/react';
import { CreateRoomResponse } from '@/redux/types';
import { Messages, Peer } from './types';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  userEmail: string;
  setUsers: React.Dispatch<React.SetStateAction<Peer[]>>;
  setRoomDetails: React.Dispatch<React.SetStateAction<{ room: CreateRoomResponse; peers: string[] } | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Messages[]>>;
  player: React.MutableRefObject<MediaPlayerInstance | null>;
  setCurrentVideo: React.Dispatch<React.SetStateAction<string>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const transformPeerMapToArray = (peerMap: { [key: string]: Peer }): Peer[] => {
  return Object.values(peerMap);
};

export function WebSocketProvider({
  children,
  userEmail,
  setUsers,
  setRoomDetails,
  setMessages,
  player,
  setCurrentVideo
}: WebSocketProviderProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const { toast } = useToast();

  const handlePeerLeft = useCallback((leftPeerEmail: string) => {
    setUsers(prevUsers => {
      return prevUsers.filter(peer => peer.email.split('@')[0] !== leftPeerEmail.split('@')[0]);
    });

    setRoomDetails((prevDetails: any) => {
      if (!prevDetails) return null;
      const updatedPeers = Object.fromEntries(
        Object.entries(prevDetails.peers).filter(([email]) => email !== leftPeerEmail)
      );
      return {
        ...prevDetails,
        peers: updatedPeers
      };
    });

    toast({
      title: 'User Left',
      description: `${leftPeerEmail.split('@')[0]} left the room`,
      variant: 'default',
    });
  }, [setUsers, setRoomDetails, toast]);

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URL!);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket Disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);
      setTimeout(connectWebSocket, 5000);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        switch (data.action) {
          case "user_joined":
            toast({
              title: 'User Joined',
              description: `${data.data?.peer?.email?.split('@')[0]} joined the room`,
              variant: 'default',
            });
            const peers: Peer[] = transformPeerMapToArray(data.data?.peers);
            setUsers(peers);
            setRoomDetails(data?.data);
            setCurrentVideo(data?.data?.room?.video_source);
            break;

          case "user_left":
            if (data?.data?.email) {
              handlePeerLeft(data.data.email);
            }
            break;

          case "update_player_state":
            if (data?.data?.state === true) {
              player.current?.pause();
            } else {
              player.current?.play();
            }
            break;

          case "update_timestamp":
            if (!data?.data?.seeking && player.current) {
              const timestamp = data?.data?.timestamp;
              const currentTime = player.current.currentTime;
              if (Math.abs(currentTime - timestamp) > 2) {
                player.current.currentTime = timestamp;
              }
            }
            break;

          case "chat_message":
            setMessages(prev => [...prev, data.data]);
            break;

          case "error":
            toast({
              title: 'Error',
              description: data.data.message,
              variant: 'destructive',
            });
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
  }, [handlePeerLeft, player, setMessages, setRoomDetails, setUsers, toast, userEmail]);

  React.useEffect(() => {
    if (userEmail) {
      connectWebSocket();
    }

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connectWebSocket, userEmail]);

  const sendMessage = useCallback((message: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
      return;
    }

    try {
      ws.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [connectWebSocket, toast]);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}