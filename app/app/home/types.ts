import { z } from "zod";

export const formSchema = z.object({
    videoUrl: z.string().url({
        message: "Please enter a valid URL",
    }).optional(),
    videoFile: z.any().optional(),
});


export interface Peer {
    email: string;
    joined_at: string;
    connection: string;
    last_ping: number;
}

export interface Messages {
    id: string;
    message: string;
    email: string;
    timestamp: string;
}