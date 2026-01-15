"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  AlertCircle,
} from "lucide-react";
import { tr } from "zod/v4/locales";

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
});

interface VideoPlayerProps {
  url: string;
  title?: string;
  thumbnail?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
  playBackPosition?: number;
}

export default function VideoPlayer({
  url,
  title,
  thumbnail,
  autoPlay = false,
  onEnded,
  onError,
  className = "",
  playBackPosition,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  //const [playBackPosition, setPlayBackPosition] = useState<number | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setPlayerRef = useCallback((player: HTMLVideoElement) => {
    if (!player) return;
    playerRef.current = player;
    //console.log(player);
  }, []);
  //Debug URL on mount/change
  useEffect(() => {
    console.log("VideoPlayer mounted with URL:", url);
    console.log("URL type:", typeof url);
    console.log("URL length:", url?.length);
  }, [url]);

  // Hide controls after inactivity
  const [hasWindow, setHasWindow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      if (playing) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    resetControlsTimeout();

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playing]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  const handleProgress = (state: any) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const bounds = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    setPlayed(percent);
    playerRef.current?.seekTo(percent);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleEnded = () => {
    setPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };

  const handleError = (error: any) => {
    console.error("Video playback error:", error);
    console.error("Video URL:", url);
    console.error("Error type:", typeof error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    setError("Failed to load video. Please try again later.");
    if (onError) {
      onError(error);
    }
  };
  const handleReady = () => {
    console.log("Video player ready with URL:", url);
    setIsReady(true);
    setError(null);
    // Try to get duration immediately when ready
    if (playerRef.current) {
      const d = playerRef.current.getDuration();
      if (d && !isNaN(d) && d !== Infinity) {
        setDuration(d);
      }
    }
  };
  const handleOnStart = () => {
    console.log("Video playback started");
    if (playBackPosition && playerRef.current) {
      if (playBackPosition > 0) {
        const playBackPercent = playBackPosition / 100;
        setPlayed(playBackPercent);
        playerRef.current.seekTo(playBackPercent);
        console.log(
          "Seeking to playback position:",
          playBackPosition,
          "seconds (",
          playBackPercent * 100,
          "% )"
        );
      }
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ("0" + date.getUTCSeconds()).slice(-2);
    if (hh) {
      return `${hh}:${("0" + mm).slice(-2)}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  // Disable right-click context menu (prevents download option)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden shadow-2xl ${className}`}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        if (playing) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Video Title */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>
      )}

      {/* React Player */}
      <div className="relative w-full aspect-video">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-lg font-medium">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsReady(false);
              }}
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          hasWindow && (
            <ReactPlayer
              ref={setPlayerRef}
              url={url}
              width="100%"
              height="100%"
              controls={false}
              playing={playing}
              volume={volume}
              muted={muted}
              playbackRate={playbackRate}
              onProgress={(state) => {
                if (!seeking && state) {
                  setPlayed(state.played);
                  setLoaded(state.loaded);
                  // Fetch duration if not yet set (fixes onDuration prop issue)
                  if (duration === 0 && playerRef.current) {
                    const d = playerRef.current.getDuration();
                    if (d && !isNaN(d) && d !== Infinity) {
                      setDuration(d);
                    }
                  }
                }
              }}
              onStart={handleOnStart}
              onEnded={handleEnded}
              onError={handleError}
              onReady={handleReady}
              playIcon={
                <button className="flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full hover:bg-purple-700 transition-all hover:scale-110">
                  <Play className="w-10 h-10 text-white ml-1" />
                </button>
              }
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload noremoteplayback",
                    disablePictureInPicture: true,
                    onContextMenu: (e: any) => e.preventDefault(),
                    playsInline: true,
                    crossOrigin: "anonymous",
                  },
                  forceVideo: true,
                  hlsOptions: {
                    forceHLS: false,
                  },
                },
                hls: {
                  forceHLS: false,
                },
                url: {
                  forceVideo: true,
                },
              }}
            />
          )
        )}
      </div>

      {/* Custom Controls */}
      {isReady && !error && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <div
              ref={progressBarRef}
              className="relative h-1.5 bg-gray-600 rounded-full cursor-pointer group"
              onClick={handleSeekClick}
            >
              {/* Loaded Progress */}
              <div
                className="absolute h-full bg-gray-400 rounded-full"
                style={{ width: `${loaded * 100}%` }}
              />

              {/* Played Progress */}
              <div
                className="absolute h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${played * 100}%` }}
              />

              {/* Seek Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${played * 100}% - 8px)` }}
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-purple-400 transition"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={handleToggleMute}
                  className="text-white hover:text-purple-400 transition"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover:w-20 transition-all duration-300 accent-purple-600"
                />
              </div>

              {/* Time */}
              <div className="text-white text-sm font-medium">
                {formatTime(duration * played)} / {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-purple-400 transition"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg p-2 min-w-[120px]">
                    <p className="text-white text-xs font-semibold mb-2 px-2">
                      Playback Speed
                    </p>
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded transition ${
                          playbackRate === rate
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:bg-gray-800"
                        }`}
                      >
                        {rate === 1 ? "Normal" : `${rate}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="text-white hover:text-purple-400 transition"
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Watermark (optional - to prevent screen recording) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-6xl font-bold pointer-events-none select-none">
        {/* Add your watermark text here if needed */}
      </div>
    </div>
  );
}
