'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import SimplePeer from 'simple-peer';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const roomId = params?.roomId as string;

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // State
  const [callSession, setCallSession] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUserName, setRemoteUserName] = useState('');
  const [error, setError] = useState('');

  // Fetch call session
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user && roomId) {
      fetchCallSession();
    }
  }, [session, roomId, status]);

  const fetchCallSession = async () => {
    try {
      const response = await fetch(`/api/calls/${roomId}`);
      const data = await response.json();

      if (data.success) {
        setCallSession(data.data);

        // Determine remote user name
        if (session?.user.id === data.data.adminId._id) {
          setRemoteUserName(data.data.customerId.fullName);
        } else {
          setRemoteUserName(data.data.adminId.fullName);
        }
      } else {
        setError(data.error);
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching call session:', error);
      setError('Failed to load call session');
      toast.error('Failed to load call session');
    }
  };

  // Initialize Socket.io and WebRTC
  useEffect(() => {
    if (!session?.user || !callSession) return;

    const initializeCall = async () => {
      try {
        // Initialize Socket.io
        await fetch('/api/socket');
        socketRef.current = io({
          path: '/api/socket',
        });

        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          socketRef.current?.emit('join-room', roomId, session.user.id);
        });

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Handle incoming user
        socketRef.current.on('user-joined', (data: { userId: string }) => {
          console.log('User joined:', data.userId);
          setIsConnecting(false);
          createPeer(data.userId, true, stream);
        });

        // Handle offer
        socketRef.current.on('offer', ({ offer, from }: any) => {
          console.log('Received offer from:', from);
          createPeer(from, false, stream, offer);
        });

        // Handle answer
        socketRef.current.on('answer', ({ answer }: any) => {
          console.log('Received answer');
          if (peerRef.current) {
            peerRef.current.signal(answer);
          }
        });

        // Handle ICE candidate
        socketRef.current.on('ice-candidate', ({ candidate }: any) => {
          console.log('Received ICE candidate');
          if (peerRef.current && candidate) {
            peerRef.current.signal(candidate);
          }
        });

        // Handle call ended
        socketRef.current.on('call-ended', () => {
          console.log('Call ended by remote user');
          handleEndCall(false);
        });

        // Handle user disconnected
        socketRef.current.on('user-disconnected', () => {
          console.log('Remote user disconnected');
          setIsConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        // Update call status to active
        await fetch(`/api/calls/${roomId}`, { method: 'PATCH' });

        setIsConnecting(false);
      } catch (error: any) {
        console.error('Error initializing call:', error);
        setError(error.message);
        toast.error('Failed to access camera/microphone');
        setIsConnecting(false);
      }
    };

    initializeCall();

    return () => {
      cleanup();
    };
  }, [session, callSession, roomId]);

  const createPeer = (
    userId: string,
    initiator: boolean,
    stream: MediaStream,
    offer?: any
  ) => {
    const peer = new SimplePeer({
      initiator,
      trickle: true,
      stream,
      config: ICE_SERVERS,
    });

    peer.on('signal', (signal) => {
      console.log('Sending signal:', initiator ? 'offer' : 'answer');

      if (initiator) {
        socketRef.current?.emit('offer', {
          roomId,
          offer: signal,
          to: userId,
        });
      } else {
        socketRef.current?.emit('answer', {
          roomId,
          answer: signal,
          to: userId,
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setIsConnected(true);
    });

    peer.on('connect', () => {
      console.log('Peer connected');
      setIsConnected(true);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      toast.error('Connection error occurred');
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
      setIsConnected(false);
    });

    if (offer) {
      peer.signal(offer);
    }

    peerRef.current = peer;
  };

  // Call duration timer
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing, go back to camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const peer = peerRef.current as any;
      const sender = peer?._pc
        ?.getSenders()
        .find((s: any) => s.track?.kind === 'video');

      if (sender) {
        sender.replaceTrack(videoTrack);
      }

      localStreamRef.current?.getVideoTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        const peer = peerRef.current as any;
        const sender = peer?._pc
          ?.getSenders()
          .find((s: any) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Screen sharing error:', error);
        toast.error('Failed to share screen');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEndCall = async (shouldNavigate = true) => {
    try {
      // End call on server
      await fetch(`/api/calls/${roomId}/end`, { method: 'POST' });

      // Notify other user
      socketRef.current?.emit('end-call', roomId);

      // Cleanup
      cleanup();

      toast.success('Call ended');

      if (shouldNavigate) {
        router.push(session?.user.role === 'Admin' ? '/admin/dashboard' : '/customer/dashboard');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      if (shouldNavigate) {
        router.push(session?.user.role === 'Admin' ? '/admin/dashboard' : '/customer/dashboard');
      }
    }
  };

  const cleanup = () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId, session?.user.id);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-red-500 mb-4">
            <PhoneOff className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Call Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-white text-sm sm:text-base font-medium">
                {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Waiting...'}
              </span>
            </div>
            {remoteUserName && (
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
                <Users className="h-3 w-3" />
                {remoteUserName}
              </Badge>
            )}
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-lg font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 h-full">
            {/* Remote Video (Main) */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gray-800 shadow-2xl order-1 lg:order-1">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  <p className="text-white text-base sm:text-lg font-medium">
                    {isConnecting ? 'Connecting to ' + remoteUserName : 'Waiting for ' + remoteUserName}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white text-xs sm:text-sm">
                  {remoteUserName || 'Remote User'}
                </Badge>
              </div>
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-gray-800 shadow-2xl order-2 lg:order-2 h-48 sm:h-64 lg:h-full">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {session?.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white text-xs sm:text-sm">
                  You {isScreenSharing && '(Sharing Screen)'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-gray-700 px-4 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {/* Mute Button */}
            <Button
              size="lg"
              variant={isMuted ? 'destructive' : 'secondary'}
              onClick={toggleMute}
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-lg"
            >
              {isMuted ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>

            {/* Video Button */}
            <Button
              size="lg"
              variant={isVideoOff ? 'destructive' : 'secondary'}
              onClick={toggleVideo}
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-lg"
            >
              {isVideoOff ? <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Video className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>

            {/* Screen Share Button */}
            <Button
              size="lg"
              variant={isScreenSharing ? 'default' : 'secondary'}
              onClick={toggleScreenShare}
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-lg hidden sm:flex"
            >
              {isScreenSharing ? <MonitorOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>

            {/* End Call Button */}
            <Button
              size="lg"
              variant="destructive"
              onClick={() => handleEndCall()}
              className="rounded-full w-12 h-12 sm:w-16 sm:h-16 p-0 shadow-lg bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            {/* Fullscreen Button */}
            <Button
              size="lg"
              variant="secondary"
              onClick={toggleFullscreen}
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-lg hidden md:flex"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize2 className="h-5 w-5 sm:h-6 sm:w-6" />}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
