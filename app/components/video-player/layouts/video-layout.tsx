import captionStyles from './captions.module.css';

import * as Tooltip from '@radix-ui/react-tooltip';
import { Captions, Controls, Gesture, MediaPlayerInstance } from '@vidstack/react';

import * as Buttons from '../buttons';
import * as Menus from '../menus';
import * as Sliders from '../sliders';
import { TimeGroup } from '../time-group';
import { Title } from '../title';

// Offset tooltips/menus/slider previews in the lower controls group so they're clearly visible.
const popupOffset = 30;

export interface VideoLayoutProps {
    thumbnails?: string;
    email: string;
    roomId: string;
    sendWebSocketMessage: (message: any) => void;
    player:React.MutableRefObject<MediaPlayerInstance | null>
}

export function VideoLayout({ thumbnails, email, roomId, sendWebSocketMessage, player }: VideoLayoutProps) {
    return (
        <>
            <Gestures />
            <Captions
                className={`${captionStyles.captions} media-preview:opacity-0 media-controls:bottom-[85px] media-captions:opacity-100 absolute inset-0 bottom-2 z-10 select-none break-words opacity-0 transition-[opacity,bottom] duration-300`}
            />
            <Controls.Root className="media-controls:opacity-100 absolute inset-0 z-10 flex h-full w-full flex-col bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity">
                <Tooltip.Provider>
                    <div className="flex-1" />
                    <Controls.Group className="flex w-full items-center px-2">
                        <Sliders.Time thumbnails={thumbnails} email={email} roomId={roomId} sendWebSocketMessage={sendWebSocketMessage} />
                    </Controls.Group>
                    <Controls.Group className="-mt-0.5 flex w-full items-center px-2 pb-2">
                        <Buttons.Play player={player} tooltipAlign="start" tooltipOffset={popupOffset} />
                        <Buttons.Mute player={player} tooltipOffset={popupOffset} />
                        <Sliders.Volume />
                        <TimeGroup />
                        <Title />
                        <div className="flex-1" />
                        {/* <Menus.Captions offset={popupOffset} tooltipOffset={popupOffset} /> */}
                        <Buttons.PIP player={player} tooltipOffset={popupOffset} />
                        <Buttons.Fullscreen player={player} tooltipAlign="end" tooltipOffset={popupOffset} />
                    </Controls.Group>
                </Tooltip.Provider>
            </Controls.Root>
        </>
    );
}

function Gestures() {
    return (
        <>
            <Gesture
                className="absolute inset-0 z-0 block h-full w-full"
                event="pointerup"
                action="toggle:paused"
            />
            <Gesture
                className="absolute inset-0 z-0 block h-full w-full"
                event="dblpointerup"
                action="toggle:fullscreen"
            />
            <Gesture
                className="absolute left-0 top-0 z-10 block h-full w-1/5"
                event="dblpointerup"
                action="seek:-10"
            />
            <Gesture
                className="absolute right-0 top-0 z-10 block h-full w-1/5"
                event="dblpointerup"
                action="seek:10"
            />
        </>
    );
}
