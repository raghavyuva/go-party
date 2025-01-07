'use client';

import React, { useState } from 'react';
import { Player } from '@/components/Player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import ChatInterface from './chat_interface';
import UserList from './user_list';
import { Peer } from './types';
import { LogOut, MoreVertical, UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import use_actions from './use_actions';
import { useWebSocket, WebSocketProvider } from './use_websocket';
import { MediaPlayerInstance } from '@vidstack/react';
import { ActionsProvider, useActions } from './action_provider';

interface HeaderAction {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    className?: string;
}

interface HeaderProps {
    title: string;
    description?: string;
    titleClassName?: string;
    actions?: HeaderAction[];
    mobileBreakpoint?: string;
}

const Header = ({
    title,
    description,
    titleClassName = "text-xl font-bold font-mono bg-gradient-to-r from-pink-600 via-yellow-500 to-pink-400 inline-block text-transparent bg-clip-text",
    actions = [],
    mobileBreakpoint = "sm"
}: HeaderProps) => {
    const DesktopActions = () => (
        <div className="flex gap-2">
            {actions.map((action, index) => (
                <Button
                    key={`desktop-${index}`}
                    onClick={action.onClick}
                    variant={action.variant || "default"}
                    className={action.className}
                >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                </Button>
            ))}
        </div>
    );

    const MobileActions = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {actions.map((action, index) => (
                    <DropdownMenuItem
                        key={`mobile-${index}`}
                        onClick={action.onClick}
                        className={action.className}
                    >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <div className={`${mobileBreakpoint}:flex flex-row justify-between items-center mb-5 hidden`}>
                <div>
                    <CardTitle className={titleClassName}>
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription>
                            {description}
                        </CardDescription>
                    )}
                </div>
                <DesktopActions />
            </div>

            <div className={`${mobileBreakpoint}:hidden flex flex-row justify-between items-center mb-5`}>
                <div>
                    <CardTitle className={titleClassName}>
                        {title}
                    </CardTitle>
                    {description && (
                        <CardDescription>
                            {description}
                        </CardDescription>
                    )}
                </div>
                <MobileActions />
            </div>
        </>
    );
};

interface JoinPartyFormProps {
    onJoin: (partyId: string) => void;
}

const JoinPartyForm = ({ onJoin }: JoinPartyFormProps) => {
    const [partyId, setPartyId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onJoin(partyId);
        setPartyId('');
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <div className="flex-1">
                <Input
                    placeholder="Enter Party ID"
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    className="w-full"
                />
            </div>
            <Button
                type="submit"
                disabled={!partyId}
                variant="secondary"
                className="w-full sm:w-auto"
            >
                Join
            </Button>
        </form>
    );
};

const Divider = () => {
    return (
        <div className="relative w-full my-8">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-foreground">Or</span>
            </div>
        </div>
    );
};

interface CreatePartyFormProps {
    form: UseFormReturn<any>;
    onSubmit: (data: any) => void;
}

const CreatePartyForm = ({ form, onSubmit }: CreatePartyFormProps) => {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-8">
                <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <FormControl className="flex-grow">
                                    <Input
                                        className="w-full"
                                        placeholder="Enter Video URL"
                                        {...field}
                                    />
                                </FormControl>
                                <Button
                                    type="submit"
                                    variant={'secondary'}
                                    className="w-full sm:w-auto"
                                    disabled={!field.value}
                                >
                                    Create
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
};

interface WatchPartyHeaderProps {
    logout: () => void;
    isWatching: boolean;
    inviteFriends: () => void;
    onLeaveParty: () => void;
}

const WatchPartyHeader = ({ logout, isWatching, inviteFriends, onLeaveParty }: WatchPartyHeaderProps) => {
    const actions = [
        ...(isWatching ? [
            {
                icon: <UserPlus className="h-4 w-4" />,
                label: "Invite Friends",
                onClick: inviteFriends,
                variant: "secondary" as any
            },
            {
                icon: <LogOut className="h-4 w-4" />,
                label: "Leave Party",
                onClick: onLeaveParty,
                variant: "outline" as any
            }
        ] : []),
        {
            icon: <LogOut className="h-4 w-4" />,
            label: "Logout",
            onClick: logout,
            variant: "destructive" as any,
        }
    ];

    return (
        <Header
            title="Watch Party 🎉"
            description="Fun watching together"
            actions={actions}
        />
    );
};

interface WhenNoPartyProps {
    logout: () => void;
    handleJoinParty: (partyId: string) => void;
    form: UseFormReturn<any>;
    onSubmit: (data: any) => void;
}

const WhenNoParty = ({ logout, handleJoinParty, form, onSubmit }: WhenNoPartyProps) => (
    <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
            <WatchPartyHeader
                logout={logout}
                isWatching={false}
                inviteFriends={() => { }}
                onLeaveParty={() => { }}
            />
        </CardHeader>
        <CardContent className="mb-5">
            <div className="w-full">
                <JoinPartyForm onJoin={handleJoinParty} />
            </div>
            <Divider />
            <CreatePartyForm form={form} onSubmit={onSubmit} />
        </CardContent>
    </Card>
);

interface PartyWatchProps {
    user: Peer;
    roomDetails: any;
    sendWebSocketMessage: (message: any) => void;
    player:React.MutableRefObject<MediaPlayerInstance | null>;
    users: Peer[];
    currentVideo: string;
    messages: any[];
    logout: () => void;
    handleInvite: () => void;
    onLeaveParty: () => void;
}

const PartyWatch = ({
    user,
    roomDetails,
    sendWebSocketMessage,
    player,
    users,
    currentVideo,
    messages,
    logout,
    handleInvite,
    onLeaveParty
}: PartyWatchProps) => (
    <div className='md:max-w-6xl md:mx-auto 2xl:max-w-full w-full p-6'>
        <WatchPartyHeader
            onLeaveParty={onLeaveParty}
            inviteFriends={handleInvite}
            isWatching={true}
            logout={logout}
        />
        <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-10/12">
                <div className="aspect-video rounded-lg overflow-hidden">
                    <Player
                        url={currentVideo}
                        player={player}
                        sendWebSocketMessage={sendWebSocketMessage}
                        email={user?.email}
                        roomId={roomDetails?.room?.id || ''}
                    />
                </div>
            </div>
            {users.length > 0 && (
                <div className="w-full lg:w-2/12 flex flex-col gap-4">
                    <div className="w-full h-full">
                        <UserList users={users} />
                    </div>
                </div>
            )}
        </div>
        <ChatInterface
            user={user}
            roomId={roomDetails?.room?.id || ''}
            sendWebSocketMessage={sendWebSocketMessage}
            messages={messages}
        />
    </div>
);
function PageContent() {
    const {
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
        handleLeaveParty
    } = useActions();

    const { sendMessage } = useWebSocket();

    const handleSubmitForm = React.useCallback((data: any) => {
        const message = onSubmit(data);
        if (message) {
            sendMessage(message);
        }
    }, [onSubmit, sendMessage]);

    const handleJoin = React.useCallback((partyId: string) => {
        const message = handleJoinParty(partyId);
        if (message) {
            sendMessage(message);
        }
    }, [handleJoinParty, sendMessage]);

    const handleLeave = React.useCallback(() => {
        if (roomDetails?.room?.id) {
            sendMessage({
                action: "leave_room",
                data: {
                    room_id: roomDetails.room.id,
                    email: user?.email
                }
            });
            handleLeaveParty();
        }
    }, [roomDetails?.room?.id, user?.email, sendMessage, handleLeaveParty]);

    return (
        <div className="flex h-screen justify-center items-center md:flex-row flex-col md:gap-12 gap-6 px-4 md:px-0">
            {!currentVideo ? (
                <WhenNoParty
                    logout={logout}
                    handleJoinParty={handleJoin}
                    form={form}
                    onSubmit={handleSubmitForm}
                />
            ) : (
                <PartyWatch
                    user={user}
                    roomDetails={roomDetails}
                    sendWebSocketMessage={sendMessage}
                    player={player}
                    users={users}
                    currentVideo={currentVideo}
                    messages={messages}
                    logout={logout}
                    handleInvite={handleInvite}
                    onLeaveParty={handleLeave}
                />
            )}
        </div>
    );
}

function MainContent() {
    const {
        user,
        setUsers,
        setRoomDetails,
        setMessages,
        player,
        setCurrentVideo
    } = useActions();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <WebSocketProvider
            userEmail={user.email}
            setUsers={setUsers}
            setRoomDetails={setRoomDetails}
            setMessages={setMessages}
            player={player}
            setCurrentVideo={setCurrentVideo}
        >
            <PageContent />
        </WebSocketProvider>
    );
}

export default function Page() {
    return (
        <ActionsProvider>
            <MainContent />
        </ActionsProvider>
    );
}