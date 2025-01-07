export interface User {
    id: string;
    username: string;
    email: string;
}

export type LoginUserRequest = {
    email: string;
    password: string;
};

export type LoginUserResponse = {
    token: string;
    email: string;
    username: string;
    id: string;
};

export type GetUserDetailsResponse = {
    data: User;
};

export type CreateRoomRequest = {
    video_source: string;
    email: string;
    timestamp: timestamp;
};

export type timestamp = {
    start: number;
    end: number;
    current: number;
}

export type CreateRoomResponse = {
    id: string;
    url: string;
    timestamp: timestamp;
    peers: string[];
    video_source: string;
    status: number;
    created_by: string;
    created_on: string;
    max_capacity: number;
};