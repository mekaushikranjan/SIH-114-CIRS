import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentConfig } from '../config/environment';

export interface WebSocketMessage {
  type: 'connection' | 'new_alert' | 'issue_update' | 'system_message' | 'pong' | 'error';
  message?: string;
  alert?: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    type: 'emergency' | 'maintenance' | 'announcement' | 'warning';
    targetAudience: 'all' | 'citizens' | 'department' | 'admins';
    department?: string;
    createdAt: string;
    expiresAt?: string;
  };
  issue?: {
    id: string;
    title: string;
    status: string;
    trackingNumber: string;
    updatedAt: string;
  };
  timestamp: string;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private isConnecting = false;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public async connect(token: string): Promise<void> {
    if (this.isConnecting || this.connectionStatus === 'connected') {
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    try {
      // Get the API base URL from environment configuration
      const config = getCurrentConfig();
      const wsUrl = `${config.WS_URL}/ws?token=${token}`;

      console.log('🔌 Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.connectionStatus = 'connected';
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send ping to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
        this.ws = null;
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.connectionStatus = 'disconnected';
      this.isConnecting = false;
      throw error;
    }
  }

  private scheduleReconnect(token: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.connectionStatus === 'disconnected') {
        this.connect(token);
      }
    }, delay);
  }

  private startPingInterval(): void {
    setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping'
        });
      }
    }, 30000); // Ping every 30 seconds
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', message.type);

    // Call registered handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  public subscribe(handlerId: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(handlerId, handler);
  }

  public unsubscribe(handlerId: string): void {
    this.messageHandlers.delete(handlerId);
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  public getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default WebSocketService;
