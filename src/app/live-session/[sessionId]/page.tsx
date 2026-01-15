'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import type SimplePeer from 'simple-peer';

// Import webrtc-adapter for cross-browser support - must be done before any WebRTC usage
let adapterLoaded = false;
if (typeof window !== 'undefined') {
  import('webrtc-adapter').then(() => {
    adapterLoaded = true;
    console.log('✅ webrtc-adapter loaded successfully');
  }).catch(err => {
    console.warn('⚠️ Failed to load webrtc-adapter:', err);
    // Even without adapter, modern browsers should work
  });
}
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize,
  Users,
  Clock,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Additional STUN servers for better connectivity
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
    // Public TURN servers for NAT traversal (helps when direct connection fails)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
};

interface Participant {
  userId: string;
  userName: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
}

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export default function LiveSessionRoom({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Set mounted flag to ensure we're on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return; // wait for next-auth to finish

    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }

    if (status === "authenticated") {
      initializeSession();
    }

    return () => cleanup();
  }, [status]);


  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionData?.status === 'live' && sessionData?.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(sessionData.startedAt).getTime()) / 1000);
        setDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionData]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeSession = async () => {
    try {
      // Only run WebRTC check in browser (not during SSR)
      if (typeof window !== 'undefined') {
        // Early WebRTC support check
        const hasWebRTC = !!(
          window.RTCPeerConnection ||
          (window as any).webkitRTCPeerConnection ||
          (window as any).mozRTCPeerConnection
        );

        if (!hasWebRTC) {
          console.error('❌ WebRTC not supported!');
          alert('Your browser does not support WebRTC. Please use a modern browser like Chrome, Firefox, Edge, or Safari.');
          router.push(session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions');
          return;
        }

        console.log('✅ WebRTC support detected:', {
          RTCPeerConnection: !!window.RTCPeerConnection,
          getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          browser: navigator.userAgent.split(' ').pop(),
        });
      }

      // Fetch session data
      const response = await fetch(`/api/live-sessions/${resolvedParams.sessionId}`);
      const data = await response.json();

      if (!data.success) {
        console.error('Failed to fetch session:', data.error);
        alert(data.error || 'Session not found or you do not have access');
        router.push(session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions');
        return;
      }

      setSessionData(data.data);

      // Check if anyone is trying to join before scheduled time
      if (data.data.status === 'scheduled' && data.data.scheduledFor) {
        const scheduledTime = new Date(data.data.scheduledFor);
        const now = new Date();

        if (now < scheduledTime) {
          const diffMs = scheduledTime.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let timeMessage = '';
          if (diffDays > 0) {
            timeMessage = `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
          } else if (diffHours > 0) {
            timeMessage = `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
          } else if (diffMins > 0) {
            timeMessage = `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
          } else {
            timeMessage = 'very soon';
          }

          const liveSessionsPath = session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions';
          alert(`This session is scheduled for ${scheduledTime.toLocaleString()}.\n\nThe session cannot be started ${timeMessage}.\n\nYou will be redirected back.`);
          router.push(liveSessionsPath);
          return;
        }
      }

      // Start session if admin and status is scheduled (and scheduled time has arrived)
      if (session?.user?.role === 'Admin' && data.data.status === 'scheduled') {
        await fetch(`/api/live-sessions/${resolvedParams.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
      }

      // Join session
      await fetch(`/api/live-sessions/${resolvedParams.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });

      // Get user media with cross-browser compatible constraints
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
      };

      console.log('📷 Requesting user media with constraints:', constraints);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Media stream obtained:', {
          audioTracks: stream.getAudioTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
      } catch (error: any) {
        console.error('❌ Failed to get media with ideal constraints:', error);
        // Fallback to basic constraints
        console.log('🔄 Trying with basic constraints...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          console.log('✅ Media stream obtained with basic constraints');
        } catch (fallbackError: any) {
          console.error('❌ Failed to get media even with basic constraints:', fallbackError);
          alert(`Camera/Microphone access denied: ${fallbackError.message}. Please allow camera and microphone access and refresh the page.`);
          return;
        }
      }

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Local video stream attached:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
        });

        // Ensure video plays automatically
        try {
          await localVideoRef.current.play();
          console.log('✅ Local video playing successfully');
        } catch (playError) {
          console.warn('⚠️ Autoplay failed, user interaction may be needed:', playError);
          // Try to play again after a short delay
          setTimeout(async () => {
            try {
              await localVideoRef.current?.play();
              console.log('✅ Local video playing after retry');
            } catch (retryError) {
              console.error('❌ Failed to play video after retry:', retryError);
            }
          }, 500);
        }
      }

      // Initialize Socket.io
      console.log('🔌 Initializing Socket.io connection...');

      try {
        await fetch('/api/socket');
      } catch (err) {
        console.warn('Failed to initialize socket endpoint, continuing anyway:', err);
      }

      // IMPORTANT: For ngrok/external access, we need to use the current window location
      const socketUrl = typeof window !== 'undefined' ? window.location.origin : '';
      console.log('🌐 Socket URL:', socketUrl);

      const socket = io(socketUrl, {
        path: '/api/socket',
        transports: ['polling', 'websocket'], // Try polling first for better compatibility
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
      });
      socketRef.current = socket;

      // Wait for socket to connect with better error handling
      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.error('❌ Socket connection timeout after 20s');
            reject(new Error('Socket connection timeout - please check your network connection'));
          }, 20000);

          socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            clearTimeout(timeout);
            resolve();
          });

          socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
          });

          // Don't reject on connect_error, let it keep trying
        });
      } catch (error) {
        console.error('Socket connection failed:', error);
        // Continue anyway - socket might connect later
      }

      // Add reconnection handlers
      socket.on('disconnect', (reason) => {
        console.warn('⚠️ Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, manually reconnect
          console.log('🔄 Attempting manual reconnection...');
          socket.connect();
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        // Rejoin the room after reconnection
        console.log('🔄 Rejoining room after reconnection...');
        socket.emit('join-room', resolvedParams.sessionId, session?.user?.id, session?.user?.name);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ Reconnection error:', error);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed after all attempts');
        alert('Lost connection to server. Please refresh the page.');
      });

      console.log('Joining room:', resolvedParams.sessionId, 'as user:', session?.user?.id, session?.user?.name);
      socket.emit('join-room', resolvedParams.sessionId, session?.user?.id, session?.user?.name);

      socket.on('user-connected', ({ userId, userName, socketId }: any) => {
        console.log('✅ USER-CONNECTED event received:', { userId, userName, socketId, myUserId: session?.user?.id });
        if (userId && userId !== session?.user?.id) {
          // Check if peer already exists
          if (peersRef.current.has(userId)) {
            console.log('⚠️ Peer already exists for', userId, '- skipping duplicate connection');
            return;
          }

          // Use a deterministic approach: only the user with the "greater" ID initiates
          // This prevents both users from initiating simultaneously
          const shouldInitiate = (session?.user?.id || '') > userId;

          if (shouldInitiate) {
            console.log('👤 I will INITIATE connection to:', userId, userName);
            // Add a small delay to ensure both sides are ready
            setTimeout(() => {
              createPeer(userId, true, userName);
            }, 100);
          } else {
            console.log('⏳ I will WAIT for offer from:', userId, userName);
            // Don't create peer yet, wait for offer
          }
        } else {
          console.log('⚠️ Ignoring self connection or invalid userId');
        }
      });

      socket.on('offer', ({ offer, from, userName }: any) => {
        console.log('📨 OFFER received from:', { from, userName, myUserId: session?.user?.id });
        if (from !== session?.user?.id) {
          // Check if we already have a peer connection with this user
          const existingPeer = peersRef.current.get(from);
          if (existingPeer && !existingPeer.destroyed) {
            console.log('⚠️ Peer already exists for', from, ', ignoring offer');
            return;
          }

          console.log('👤 Accepting offer and creating peer as RECEIVER for user:', from);
          createPeer(from, false, userName, offer);
        } else {
          console.log('⚠️ Ignoring offer from self');
        }
      });

      socket.on('answer', ({ answer, from, userName }: any) => {
        console.log('📬 ANSWER received from:', { from, userName });
        const peer = peersRef.current.get(from);
        if (peer && answer) {
          // Check if peer is in the correct state to receive an answer
          try {
            const peerConnection = (peer as any)._pc;
            if (peerConnection && peerConnection.signalingState === 'have-local-offer') {
              console.log('✅ Signaling peer with answer (state:', peerConnection.signalingState, ')');
              peer.signal(answer);
            } else {
              console.log('⚠️ Peer not in correct state for answer. State:', peerConnection?.signalingState || 'unknown');
            }
          } catch (err) {
            console.error('❌ Error signaling answer:', err);
          }
        } else {
          console.log('❌ No peer found for:', from, 'Available peers:', Array.from(peersRef.current.keys()));
        }
      });

      socket.on('ice-candidate', ({ candidate, from }: any) => {
        const peer = peersRef.current.get(from);
        if (peer && candidate) {
          peer.signal(candidate);
        }
      });

      socket.on('user-disconnected', (userId: string) => {
        console.log('User disconnected:', userId);
        const peer = peersRef.current.get(userId);
        if (peer) {
          peer.destroy();
          peersRef.current.delete(userId);
        }
        setParticipants((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      socket.on('chat-message', (data: ChatMessage) => {
        console.log('Received chat message:', data);
        setMessages((prev) => [...prev, data]);
      });

      socket.on('session-ended', ({ adminId }: { adminId: string }) => {
        console.log('📢 Session ended by admin:', adminId);
        if (adminId !== session?.user?.id) {
          // Only show alert if we're not the admin who ended it
          alert('The session has been ended by the host');
        }

        // Redirect BEFORE cleanup to avoid session issues
        const redirectPath = session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions';
        console.log('Call ended by host. Redirecting to:', redirectPath);

        // Use window.location for more reliable navigation after session end
        if (typeof window !== 'undefined') {
          window.location.href = redirectPath;
        } else {
          router.push(redirectPath);
        }

        // Cleanup after a short delay to allow navigation to start
        setTimeout(() => {
          cleanup();
        }, 100);
      });

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to initialize session:', error);
      alert(error.message || 'Failed to access camera/microphone');
      router.push(session?.user?.role === 'Admin' ? '/admin/dashboard' : '/customer/dashboard');
    }
  };

  const createPeer = async (userId: string, initiator: boolean, userName: string = 'Participant', offer?: any) => {
    console.log('🔧 createPeer called:', { userId, initiator, userName, hasOffer: !!offer, hasLocalStream: !!localStreamRef.current });

    // Check if we're in browser
    if (typeof window === 'undefined') {
      console.error('❌ createPeer called on server side!');
      return;
    }

    // Check WebRTC support - check for various vendor prefixes
    const hasWebRTC = !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );

    if (!hasWebRTC) {
      console.error('❌ WebRTC not supported in this browser!');
      console.error('Browser info:', {
        userAgent: navigator.userAgent,
        RTCPeerConnection: !!window.RTCPeerConnection,
        webkitRTCPeerConnection: !!(window as any).webkitRTCPeerConnection,
        mozRTCPeerConnection: !!(window as any).mozRTCPeerConnection,
      });
      alert('Your browser does not support WebRTC. Please use Chrome, Firefox, or Safari.');
      return;
    }

    if (!localStreamRef.current) {
      console.error('❌ No local stream available!');
      return;
    }

    // Check if peer already exists - IMPORTANT: This prevents the infinite loop
    if (peersRef.current.has(userId)) {
      console.warn('⚠️ Peer already exists for userId:', userId, '- skipping creation');
      const existingPeer = peersRef.current.get(userId);

      // Check if peer is destroyed
      if (existingPeer && existingPeer.destroyed) {
        console.log('🗑️ Peer was destroyed, removing and creating new one');
        peersRef.current.delete(userId);
        setParticipants((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
        // Don't return, allow creation of new peer below
      } else {
        // Peer exists and is active - don't signal, just skip
        console.log('✅ Peer is active, skipping duplicate creation');
        return;
      }
    }

    console.log('🚀 Creating SimplePeer for:', userId, 'as', initiator ? 'INITIATOR' : 'RECEIVER');

    try {
      // Dynamically import SimplePeer to avoid SSR issues
      const SimplePeerModule = await import('simple-peer');
      const SimplePeer = SimplePeerModule.default;

      console.log('✅ SimplePeer module loaded');

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream: localStreamRef.current,
        config: ICE_SERVERS,
      });

      console.log('✅ SimplePeer instance created');

      peer.on('signal', (signal) => {
        console.log('📡 Peer signal event:', {
          userId,
          initiator,
          signalType: signal.type,
          myUserId: session?.user?.id,
          myName: session?.user?.name
        });

        if (!socketRef.current) {
          console.error('❌ Socket not connected, cannot send signal');
          return;
        }

        if (initiator && signal.type === 'offer') {
          console.log('📤 Sending OFFER to:', userId, 'in room:', resolvedParams.sessionId);
          socketRef.current.emit('offer', {
            roomId: resolvedParams.sessionId,
            offer: signal,
            to: userId,
            userId: session?.user?.id,
            userName: session?.user?.name || 'User',
          });
        } else if (!initiator && signal.type === 'answer') {
          console.log('📤 Sending ANSWER to:', userId, 'in room:', resolvedParams.sessionId);
          socketRef.current.emit('answer', {
            roomId: resolvedParams.sessionId,
            answer: signal,
            to: userId,
            userId: session?.user?.id,
            userName: session?.user?.name || 'User',
          });
        } else if ((signal as any).candidate) {
          // Handle ICE candidates
          console.log('🧊 Sending ICE candidate to:', userId);
          socketRef.current.emit('ice-candidate', {
            roomId: resolvedParams.sessionId,
            candidate: signal,
            to: userId,
            userId: session?.user?.id,
          });
        }
      });

      peer.on('stream', (remoteStream) => {
        console.log('🎥 Received remote stream from:', userId, userName);
        setParticipants((prev) => {
          const newMap = new Map(prev);
          newMap.set(userId, {
            userId,
            userName: userName || 'Participant',
            peer,
            stream: remoteStream,
          });
          console.log('✅ Participant added to state:', userId, 'Total participants:', newMap.size);
          return newMap;
        });
      });

      // Monitor ICE connection state changes
      const peerConnection = (peer as any)._pc;
      if (peerConnection) {
        peerConnection.oniceconnectionstatechange = () => {
          const state = peerConnection.iceConnectionState;
          console.log(`🧊 ICE connection state for ${userId}:`, state);

          if (state === 'failed') {
            console.error('❌ ICE connection failed for', userId);
            console.log('Attempting to restart ICE...');
            // Try to restart ICE
            peerConnection.restartIce?.();
          } else if (state === 'disconnected') {
            console.warn('⚠️ ICE disconnected for', userId, '- waiting for reconnection');
          } else if (state === 'connected' || state === 'completed') {
            console.log('✅ ICE connected for', userId);
          }
        };

        peerConnection.onconnectionstatechange = () => {
          const state = peerConnection.connectionState;
          console.log(`🔌 Connection state for ${userId}:`, state);
        };

        peerConnection.onicegatheringstatechange = () => {
          console.log(`🧊 ICE gathering state for ${userId}:`, peerConnection.iceGatheringState);
        };
      }

      peer.on('connect', () => {
        console.log('🔗 Peer connected:', userId);
      });

      peer.on('error', (err) => {
        console.error('❌ Peer error for', userId, ':', err);
        console.error('Error details:', {
          errorType: err.name,
          errorMessage: err.message,
          peerDestroyed: peer.destroyed,
          connectionState: (peer as any)._pc?.connectionState,
          iceConnectionState: (peer as any)._pc?.iceConnectionState,
          iceGatheringState: (peer as any)._pc?.iceGatheringState,
        });

        // Don't immediately destroy on connection errors - give it time to recover
        if (err.message === 'Connection failed.') {
          console.log('⏳ Connection failed, but keeping peer alive for potential recovery');
          // The peer will try to reconnect automatically
          return;
        }

        // Clean up peer on fatal errors
        if (peer.destroyed) {
          console.log('🗑️ Cleaning up destroyed peer after error:', userId);
          peersRef.current.delete(userId);
          setParticipants((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        }
      });

      peer.on('close', () => {
        console.log('🔌 Peer connection closed:', userId);
        // Clean up peer on close
        peersRef.current.delete(userId);
        setParticipants((prev) => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      });

      // Store peer before signaling to prevent race conditions
      peersRef.current.set(userId, peer);
      console.log('✅ Peer stored in peersRef for:', userId);

      if (offer) {
        console.log('📥 Signaling peer with received offer');
        try {
          peer.signal(offer);
        } catch (err) {
          console.error('❌ Error signaling offer:', err);
          // Clean up peer on error
          peersRef.current.delete(userId);
          peer.destroy();
        }
      }
    } catch (error) {
      console.error('❌ Error creating peer:', error);
      alert('Failed to create peer connection. Please refresh the page and try again.');
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        } as any);

        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peersRef.current.forEach((peer) => {
          const peerConnection = (peer as any)._pc;
          const sender = peerConnection?.getSenders().find((s: any) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Screen share error:', error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];

      // Replace screen track with camera track
      peersRef.current.forEach((peer) => {
        const peerConnection = (peer as any)._pc;
        const sender = peerConnection?.getSenders().find((s: any) => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      roomId: resolvedParams.sessionId,
      message: newMessage.trim(),
      userName: session?.user?.name || 'User',
      userId: session?.user?.id,
    });

    setNewMessage('');
  };

  const endSession = async () => {
    try {
      if (session?.user?.role === 'Admin') {
        const confirmEnd = confirm('Are you sure you want to end this session for everyone?');
        if (!confirmEnd) return;

        await fetch(`/api/live-sessions/${resolvedParams.sessionId}/end`, {
          method: 'POST',
        });

        // Notify all participants that the session has ended
        socketRef.current?.emit('end-session', {
          roomId: resolvedParams.sessionId,
          adminId: session?.user?.id
        });
      }

      // Redirect to live-sessions page BEFORE cleanup
      const redirectPath = session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions';
      console.log('Session ended. Redirecting to:', redirectPath);

      // Use window.location for more reliable navigation
      if (typeof window !== 'undefined') {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }

      // Cleanup after a short delay to allow navigation to start
      setTimeout(() => {
        cleanup();
      }, 100);
    } catch (error) {
      console.error('Error ending session:', error);
      // Still try to redirect and cleanup
      const fallbackPath = session?.user?.role === 'Admin' ? '/admin/live-sessions' : '/customer/live-sessions';

      if (typeof window !== 'undefined') {
        window.location.href = fallbackPath;
      } else {
        router.push(fallbackPath);
      }

      setTimeout(() => {
        cleanup();
      }, 100);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();

    if (socketRef.current) {
      socketRef.current.emit('leave-room', resolvedParams.sessionId, session?.user?.id);
      socketRef.current.disconnect();
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show loading during SSR or while initializing
  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Connecting to session...</p>
        </div>
      </div>
    );
  }

  const participantsArray = Array.from(participants.values());

  return (
    <div
      ref={containerRef}
      className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-3 sm:px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-base sm:text-lg md:text-xl font-bold truncate">{sessionData?.title}</h1>
            <p className="text-gray-400 text-xs sm:text-sm truncate">{sessionData?.description}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
            <div className="flex items-center gap-1 sm:gap-2 text-white">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-mono text-sm sm:text-base md:text-lg">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-white">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{participantsArray.length + 1}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs sm:text-sm font-medium">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* Video Grid */}
        <div className="flex-1 p-2 sm:p-3 md:p-4 overflow-y-auto">
          <div
            className={`grid gap-2 sm:gap-3 md:gap-4 h-full ${participantsArray.length === 0
              ? 'grid-cols-1'
              : participantsArray.length === 1
                ? 'grid-cols-1 sm:grid-cols-2'
                : participantsArray.length <= 4
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
          >
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg md:rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/30 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                <span className="text-white text-xs sm:text-sm font-medium">
                  You {session?.user?.role === 'Admin' && '(Host)'}
                </span>
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <VideoOff className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-500" />
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {participantsArray.map((participant) => (
              <RemoteVideo key={participant.userId} participant={participant} />
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`transition-all duration-300 ${isChatOpen ? 'w-full md:w-80 lg:w-96' : 'w-0'
            } bg-black/40 backdrop-blur-sm border-t md:border-t-0 md:border-l border-white/10 flex flex-col ${isChatOpen ? 'h-1/2 md:h-auto' : ''
            }`}
        >
          {isChatOpen && (
            <>
              {/* Chat Header */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white text-sm sm:text-base font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  Chat
                </h3>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-4 sm:mt-8">
                    <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`${msg.userId === session?.user?.id
                        ? 'ml-auto bg-purple-600'
                        : 'mr-auto bg-gray-700'
                        } max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3`}
                    >
                      <p className="text-[10px] sm:text-xs text-gray-300 mb-1">{msg.userName}</p>
                      <p className="text-white text-xs sm:text-sm break-words">{msg.message}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-2 sm:p-3 md:p-4 border-t border-white/10">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
          <button
            onClick={toggleAudio}
            className={`p-2.5 sm:p-3 md:p-4 rounded-full transition-all ${isAudioEnabled
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            ) : (
              <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-2.5 sm:p-3 md:p-4 rounded-full transition-all ${isVideoEnabled
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {isVideoEnabled ? (
              <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            ) : (
              <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2.5 sm:p-3 md:p-4 rounded-full transition-all ${isScreenSharing
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-700 hover:bg-gray-600'
              }`}
          >
            {isScreenSharing ? (
              <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            ) : (
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 sm:p-3 md:p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all hidden sm:block"
          >
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2.5 sm:p-3 md:p-4 rounded-full transition-all relative ${isChatOpen
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-700 hover:bg-gray-600'
              }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            {messages.length > 0 && !isChatOpen && (
              <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={endSession}
            className="p-2.5 sm:p-3 md:p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all ml-1 sm:ml-2 md:ml-4"
          >
            <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoteVideo({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg md:rounded-xl overflow-hidden shadow-2xl border-2 border-blue-500/30 min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
        <span className="text-white text-xs sm:text-sm font-medium">{participant.userName}</span>
      </div>
    </div>
  );
}
