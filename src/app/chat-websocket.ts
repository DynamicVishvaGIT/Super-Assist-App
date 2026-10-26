import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatWebsocket {

  private socket: WebSocket | null = null;

  private messageSubject = new Subject<any>();
  private connectionSubject = new Subject<boolean>();

  messages$: Observable<any> = this.messageSubject.asObservable();
  connection$: Observable<boolean> = this.connectionSubject.asObservable();

  private wsUrl = 'wss://dvchat.dvworks.in/ws/inbox/';

  private token: string | undefined;

  private reconnectTimer: any = null;
  private reconnectAttempts = 0;

  private manuallyDisconnected = false;

  constructor(private zone: NgZone) {}

  /**
   * Connect WebSocket
   */
  connect(token?: string): void {

    this.token = token;
    this.manuallyDisconnected = false;

    // Already connected
    if (
      this.socket &&
      (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    this.clearReconnectTimer();

    const url = this.token
      ? `${this.wsUrl}?token=${encodeURIComponent(this.token)}`
      : this.wsUrl;

    console.log('Connecting WebSocket:', url);

    try {

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {

        console.log('WebSocket connected');

        this.reconnectAttempts = 0;

        this.zone.run(() => {
          this.connectionSubject.next(true);
        });
      };

      this.socket.onmessage = (event) => {

        try {

          const data = JSON.parse(event.data);

          console.log('WebSocket event:', data);

          this.zone.run(() => {
            this.messageSubject.next(data);
          });

        } catch (error) {

          console.error(
            'Invalid WebSocket message:',
            event.data,
            error
          );

        }
      };

      this.socket.onerror = (error) => {

        console.error('WebSocket error:', error);

      };

      this.socket.onclose = (event) => {

        console.log(
          'WebSocket disconnected',
          'Code:',
          event.code,
          'Reason:',
          event.reason
        );

        this.zone.run(() => {
          this.connectionSubject.next(false);
        });

        this.socket = null;

        // Automatically reconnect
        if (!this.manuallyDisconnected) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {

      console.error(
        'WebSocket connection failed:',
        error
      );

      this.scheduleReconnect();
    }
  }

  /**
   * Send data to WebSocket server
   */
  send(data: any): void {

    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {

      console.log('WebSocket send:', data);

      this.socket.send(
        JSON.stringify(data)
      );

    } else {

      console.warn(
        'WebSocket is not connected. Message not sent:',
        data
      );

    }
  }

  /**
   * Disconnect manually
   */
  disconnect(): void {

    this.manuallyDisconnected = true;

    this.clearReconnectTimer();

    if (this.socket) {

      this.socket.close();

      this.socket = null;
    }

    this.zone.run(() => {
      this.connectionSubject.next(false);
    });
  }

  /**
   * Automatic reconnect
   */
  private scheduleReconnect(): void {

    if (
      this.manuallyDisconnected ||
      this.reconnectTimer
    ) {
      return;
    }

    this.reconnectAttempts++;

    // 2 sec, 4 sec, 6 sec ... maximum 30 sec
    const delay = Math.min(
      this.reconnectAttempts * 2000,
      30000
    );

    console.log(
      `WebSocket reconnecting in ${delay / 1000} seconds...`
    );

    this.reconnectTimer = setTimeout(() => {

      this.reconnectTimer = null;

      this.connect(this.token);

    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {

    if (this.reconnectTimer) {

      clearTimeout(this.reconnectTimer);

      this.reconnectTimer = null;
    }
  }

  /**
   * Check connection
   */
  isConnected(): boolean {

    return !!(
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    );
  }
}