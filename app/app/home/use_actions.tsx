// hooks/use_actions.ts
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { formSchema, Messages, Peer } from './types';
import { useToast } from '@/hooks/use-toast';
import { CreateRoomRequest, CreateRoomResponse } from '@/redux/types';
import use_get_user from './use_get_user';
import { MediaPlayerInstance } from '@vidstack/react';

export default function use_actions() {
  const [currentVideo, setCurrentVideo] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('url');
  const { toast } = useToast();
  const player = useRef<MediaPlayerInstance>(null);
  const [users, setUsers] = React.useState<Peer[]>([]);
  const { user } = use_get_user();
  const [roomDetails, setRoomDetails] = React.useState<{ room: CreateRoomResponse; peers: string[] } | null>(null);
  const [messages, setMessages] = React.useState<Messages[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: "",
      videoFile: undefined,
    },
  });

  function handleJoinParty(partyId: string) {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        variant: 'destructive',
      });
      return;
    }
    return {
      action: "join_room",
      data: {
        room_id: partyId,
        email: user.email
      }
    };
  }

  function handleLeaveParty() {
    if (roomDetails?.room?.id) {
      setCurrentVideo('');
      setRoomDetails(null);
      setUsers([]);
      setMessages([]);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    window.location.href = "/login";
  }

  function onSubmit(data: any) {
    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'Please log in first',
        variant: 'destructive',
      });
      return;
    }

    if (activeTab === 'url' && data.videoUrl) {
      setCurrentVideo(data.videoUrl);
      return {
        action: "create_room",
        data: {
          video_source: data.videoUrl,
          email: user.email,
          timestamp: { start: 0, end: 100, current: 0 }
        } as CreateRoomRequest
      };
    }
  }

  function handleInvite() {
    if (!roomDetails || !roomDetails.room || !roomDetails.room.id) {
      toast({
        title: 'Error',
        description: 'No active room to invite to',
        variant: 'destructive',
      });
      return;
    }

    const inviteLink = roomDetails.room.id;

    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        toast({
          title: 'Invite Link',
          description: 'Copied to clipboard: ' + inviteLink,
          variant: 'default',
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast({
          title: 'Error',
          description: 'Failed to copy invite link',
          variant: 'destructive',
        });
      });
  }

  return {
    user,
    roomDetails,
    player,
    users,
    form,
    onSubmit,
    currentVideo,
    handleJoinParty,
    logout,
    handleInvite,
    messages,
    handleLeaveParty,
    setUsers,
    setRoomDetails,
    setMessages,
    setCurrentVideo
  };
}