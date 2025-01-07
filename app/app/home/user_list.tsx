import React from 'react';
import { Users } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Peer } from './types';

const UserList = ({ users = [] }: { users: Peer[] }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getUserColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-yellow-500',
            'bg-pink-500',
            'bg-indigo-500',
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    };

    if (!users?.length) {
        return (
            <Card className="w-full h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        No members in party
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full h-full flex flex-col">
            <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members ({users.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex-1 relative">
                <ScrollArea className="absolute inset-0 pr-4">
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.email}
                                className="flex items-center gap-3 group hover:bg-secondary rounded-lg p-2 transition-colors"
                            >
                                <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getUserColor(user.email.split('@')[0])}`}>
                                    <span className="font-semibold text-white text-sm">
                                        {getInitials(user.email.split('@')[0])}
                                    </span>
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                                </div>
                                <div className='flex flex-row justify-between w-full'>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none">{user.email.split('@')[0]}</span>
                                        <span className="text-xs text-muted-foreground">Online</span>
                                    </div>
                                    {/* <div className="ml-auto flex items-center space-x-4">
                                        <span className="text-xs text-muted-foreground">{new Date(user.joined_at).toLocaleString()}</span>
                                    </div> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export default UserList;