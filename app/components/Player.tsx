"use client"
import '@vidstack/react/player/styles/base.css';
import React, { useEffect, useState } from 'react';
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaCanPlayDetail,
  type MediaCanPlayEvent,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
  type MediaProviderChangeEvent,
} from '@vidstack/react';
import { VideoLayout } from './video-player/layouts/video-layout';

export function Player({ url, player, email, roomId, sendWebSocketMessage }: { url: string, player: React.MutableRefObject<MediaPlayerInstance | null>, email: string, roomId: string, sendWebSocketMessage: (message: any) => void }) {
  const [videoSrc, setVideoSrc] = useState<string>(url);
  // const [isYouTube, setIsYouTube] = useState<boolean>(false);

  // useEffect(() => {
  //   const processYouTubeUrl = async () => {
  //     const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  //     if (youtubeRegex.test(url)) {
  //       setIsYouTube(true);
  //       let videoId = '';
  //       if (url.includes('youtube.com/watch')) {
  //         videoId = new URL(url).searchParams.get('v') || '';
  //       } else if (url.includes('youtu.be')) {
  //         videoId = url.split('/').pop() || '';
  //       }
  //       if (videoId) {
  //         const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
  //         setVideoSrc(embedUrl);
  //       }
  //     } else {
  //       setIsYouTube(false);
  //       setVideoSrc(url);
  //     }
  //   };

  //   processYouTubeUrl();
  // }, [url]);

  function onProviderChange(
    provider: MediaProviderAdapter | null,
    nativeEvent: MediaProviderChangeEvent,
  ) {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {};
    }
  }

  // We can listen for the `can-play` event to be notified when the player is ready.
  function onCanPlay(detail: MediaCanPlayDetail, nativeEvent: MediaCanPlayEvent) {
    // ...
  }

  React.useEffect(() => {
    player.current?.subscribe(({ paused, viewType }) => {
        if(!roomId || !email) return;
        console.log('is paused?', '->', paused);
        const message = {
          action: "player_state",
          data: {
            room_id: roomId,
            email: email,
            paused
          }
        }
        sendWebSocketMessage(message);
      // console.log('is audio view?', '->', state.viewType === 'audio');
    });
  }, [player, roomId, email, sendWebSocketMessage]);
  
  // if (isYouTube) {
  //   return (
  //     <div className="w-full aspect-video bg-slate-900 text-white font-sans overflow-hidden rounded-md">
  //       <iframe
  //         src={videoSrc}
  //         className="w-full h-full"
  //         allowFullScreen
  //         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  //       />
  //     </div>
  //   );
  // }

  return (
    <MediaPlayer
      className="w-full aspect-video bg-slate-900 text-white font-sans overflow-hidden rounded-md ring-media-focus data-[focus]:ring-4"
      title=""
      src={videoSrc}
      crossOrigin="anonymous"
      playsInline
      onProviderChange={onProviderChange}
      onCanPlay={onCanPlay}
      ref={player}
    >
      <MediaProvider>
        <Poster
          className="absolute inset-0 block h-full w-full rounded-md opacity-0 transition-opacity data-[visible]:opacity-100 object-cover"
          src={videoSrc}
          alt=""
        />
        <VideoLayout email={email} roomId={roomId} sendWebSocketMessage={sendWebSocketMessage} player={player} />
      </MediaProvider>
    </MediaPlayer>
  );
}