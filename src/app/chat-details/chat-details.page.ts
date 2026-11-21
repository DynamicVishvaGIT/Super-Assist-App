import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActionSheetController, AlertController, IonContent, ModalController, Platform, ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { ChatMenuComponent } from '../chat-menu/chat-menu.component';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { Api } from '../api';
import { Common } from '../common';
import { User } from '../user';
import { ChatWebsocket } from '../chat-websocket';

export interface ChatButton {
  d?: number;
  action_type: string;
  action_value: string;
  label: string;
}
export interface ChatTemplate {
  
  id?: number;
  header_type?: string;
  header_text?: string;
  header_media_file?: string;
  header_file_name?: string;
  body_content?: string;
  // body_var_count?: number;
  // body_var_names?: string;
  body_var_values?: string;
  footer_content?: string;
  buttons?: ChatButton[];
}
export interface ParentMessage {
  id?: number;
  message_type?: string;
  sender_name?: string;
  preview_text?: string;
  body_var_values?: string;
}

export interface ChatMessage {
  id:number;
  direction:'IN'|'OUT';
  sender:'me'|'other';
  message_type:string;
  status:string;
  created_at:string;
  displayDate:string;
  showDate:boolean;
  time:string;
  text:string;
  renderedBody:string;
  media_path?:string;
  file_name?:string;
  latitude?:number;
  longitude?:number;
  address?:string;
  location_name?:string;
  contact_name?:string;
  contact_number?:string;
  template?:ChatTemplate|null;
  parent_message?:ParentMessage|null;
}

@Component({
  selector: 'app-chat-details',
  templateUrl: './chat-details.page.html',
  styleUrls: ['./chat-details.page.scss'],
  standalone: false,
})
export class ChatDetailsPage implements OnInit, OnDestroy {

  private _unsubscribeAll: Subject<any>;
  backButtonSub!: Subscription;

  // @ViewChild(IonContent) content!: IonContent;
  @ViewChild(IonContent,{static:false})
  content!:IonContent;

  @ViewChild('cameraInput',{static:false})
  cameraInput!: ElementRef<HTMLInputElement>;
  // @ViewChild('content', { static: false }) content!: IonContent;
  currentUser:any;
  chat: any;
  recipientNo: string = '';
  newMessage: string = '';
  contactName: string = '';
  messages: ChatMessage[] = [];
  loading = false;
  // messages: any[] = [
  //   {
  //     text: 'Hello 👋',
  //     sender: 'other',
  //     time: '10:10 am'
  //   },
  //   {
  //     text: 'Hi, how are you?',
  //     sender: 'me',
  //     time: '10:11 am'
  //   },
  //   {
  //     text: 'I am good 😊',
  //     sender: 'other',
  //     time: '10:12 am'
  //   }
  // ];
  isEdit = false;
  tempUser: any = null;
  contact: any = {};

  isMuted = false;
  selectionMode = false;
  showTemplateOnlyFooter = false;
  today = new Date();
  selectedMessages: ChatMessage[] = [];
  imgURL = 'https://dvchat.dvworks.in';

 
  // Local UI only. No API/service behavior is changed.
  showEmojiPicker = false;
  messageText: string = ''; // Your bound message string variable
  private typingTimer: any;
  private isTypingSent = false;
  isOtherTyping = false;

readonly emojiList: string[] = [
  // Faces & Expressions
  '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌',
  '😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩',
  '🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','cry',
  '😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗',
  '🤔','chuckle','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮',
  // Gestures & Body
  '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
  '👆','🖕','👇','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️',
  // Hearts, Symbols & Misc
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗',
  '💖','💘','💝','💯','🔥','💥','✨','🌟','⭐','💫','💦','💨','🎉','🎊','🎈',
  '🎂','🎁','🏆','⚽','🏀','🏈','⚾','🎾','🍕','🍔','🍟','🍿','☕','🧃','🍺','🍻'
];


  constructor(private router: Router, private modalCtrl: ModalController,private actionSheetCtrl: ActionSheetController,private alertCtrl: AlertController,
    private toastCtrl: ToastController, private userService: User, private commonService: Common, private apiService: Api, private platform: Platform,
    private chatWebSocket: ChatWebsocket) { 
    this._unsubscribeAll = new Subject();
    // const nav = this.router.getCurrentNavigation();
    // this.chat = nav?.extras?.state?.['chat'];
    // if(this.chat){
    //   this.contactName = this.chat.contacts__name ||''  ;
    // }
    // console.log(this.chat);
    // this.checkConversationWindow(this.chat.last_in_message_at);
  }

  ngOnInit() {
    // Subscribe once
    this.subscribeToWebSocket();
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/chat-details') {
        const nav = this.router.getCurrentNavigation();
        this.chat = nav?.extras?.state?.['chat'];
        if(this.chat){
          this.contactName = this.chat.contacts__name ||''  ;
          this.isOtherTyping = false;
          this.isTypingSent = false;
        }
        console.log(this.chat);
        this.checkConversationWindow(this.chat.last_in_message_at);
        this.userService.currentUser$.subscribe(user => {
        if (user) {
          this.currentUser = user;
          console.log('39',this.currentUser);
        } 
        else {
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            console.log('44',this.currentUser);
          }
        }
      });
      this.get_message_list();
      this.scrollToBottom();
      }
    });
    // this.userService.currentUser$.subscribe(user => {
    //   if (user) {
    //     this.currentUser = user;
    //     console.log('39',this.currentUser);
    //   } 
    //   else {
    //     const storedUser = localStorage.getItem('currentUser');
    //     if (storedUser) {
    //       this.currentUser = JSON.parse(storedUser);
    //       console.log('44',this.currentUser);
    //     }
    //   }
    // });
    // this.get_message_list();
    // this.scrollToBottom();
  }
  onTyping(): void {
    if (!this.chat?.id) {
      return;
    }
    if (!this.isTypingSent) {
      this.isTypingSent = true;
      this.chatWebSocket.send({
        event: 'typing',
        chat_id: this.chat.id,
        typing: true
      });
    }
    clearTimeout(
      this.typingTimer
    );
    this.typingTimer = setTimeout(() => {
      this.isTypingSent = false;
      this.chatWebSocket.send({
        event: 'typing',
        chat_id: this.chat.id,
        typing: false
      });
    }, 1200);
  }
  private subscribeToWebSocket(): void {
    this.chatWebSocket.messages$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((event: any) => {
        console.log('ChatDetails WebSocket event:', event);
        this.handleWebSocketEvent(event);
      });
  }


private handleWebSocketEvent(event: any): void {
  if (!event) {
    return;
  }
  console.log('Incoming WebSocket event:', event);
  // INBOX UPDATE: Fetch the latest messages from the API
  if (event.type === 'INBOX_UPDATE') {
    if (this.chat?.id) {
      console.log('Inbox updated. Refreshing messages...');
      this.get_message_list(false);
    }
    return;
  }
  // TYPING EVENT
  if (event.event === 'typing') {
    this.handleTypingEvent(event);
    return;
  }
  // DIRECT MESSAGE EVENT, if the backend sends one
  if (event.event === 'message' || event.message || event.data) {
    this.handleIncomingMessage(event);
  }
}

  // private handleWebSocketEvent(event: any): void {
  //   if (!event) {
  //     return;
  //   }
  //   console.log('Incoming WebSocket event:',event);
  //   // -----------------------------
  //   // TYPING EVENT
  //   // -----------------------------
  //   if (event.event === 'typing') {
  //     this.handleTypingEvent(event);
  //     return;
  //   }
  //   // -----------------------------
  //   // MESSAGE EVENT
  //   // -----------------------------
  //   if (event.event === 'message' || event.message || event.data) {
  //     // const messageData = event.message || event.data || event;
  //     // if (!messageData) {
  //     //   return;
  //     // }
  //     // if (!messageData.id || !messageData.direction) {
  //     //   return;
  //     // }
  //     this.handleIncomingMessage(event);
  //   }
  // }
  private handleTypingEvent(event: any): void {
    // Make sure typing event belongs
    // to currently opened conversation
    if (event.chat_id !== undefined && Number(event.chat_id) !== Number(this.chat?.id)) {
      return;
    }
    this.isOtherTyping = event.typing === true;
    console.log('Other user typing:',this.isOtherTyping);
  }
  private handleIncomingMessage(event: any): void {
    if (!event) {
      return;
    }
    // Check current conversation
    if (event.chat_id !== undefined && Number(event.chat_id) !== Number(this.chat?.id)) {
      return;
    }
    // Extract actual message
    const item = event.message || event.data || event;
    if (!item) {
      return;
    }
    // Only incoming messages
    if (item.direction !== 'IN') {
      return;
    }
    // Prevent duplicate messages
    const exists = this.messages.some(msg => Number(msg.id) === Number(item.id));
    if (exists) {
      console.log('Message already exists:',item.id);
      return;
    }
    const message = this.mapMessage(item);
    this.messages = [...this.messages,message];
    this.groupDateLabels(this.messages);
    this.scrollToBottom();
    console.log('New message added:',message);
  }

  openContactDetail(): void {
    if (!this.chat) {
      return;
    }

    this.router.navigate(['/contact-detail'], {
      state: {
        chat: this.chat
      }
    });
    // const currentName =
    //   this.contactName ||
    //   this.chat?.contacts__name ||
    //   contact?.name ||
    //   '';

    // const currentPhone =
    //   this.recipientNo ||
    //   this.chat?.recipient_no ||
    //   contact?.phone ||
    //   '';

    // const contactData = {
    //   ...(contact || {}),
    //   name: currentName,
    //   phone: currentPhone,
    //   groups: contact?.groups || [],
    //   media: contact?.media || [],
    //   avatar: contact?.avatar || contact?.profile_image || ''
    // };

    // console.log('Opening Contact Detail:', contactData);

    // this.router.navigate(['/contact-detail'], {
    //   state: {
    //     contact: contactData,
    //     chat: this.chat,
    //     contactName: currentName,
    //     recipientNo: currentPhone
    //   }
    // });
  }

  //   this.router.navigate(['/contact-detail'], {
  //     state: {
  //       contact: contact,
  //       chat: this.chat,
  //       contactName: this.contactName,
  //       recipientNo: this.recipientNo
  //     }
  //   });
  // }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    this.isOtherTyping = false;
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  get_message_list(showLoader: boolean = true) {
    if (showLoader) {
      this.loading = true;
      this.commonService.presentLoading();
    }
    this.apiService.message_list(this.chat.id)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({next: (response: any) => {
        this.loading = false;
        this.commonService.dismissLoading();
        console.log('Message Response', response);
        this.recipientNo = response.recipient_no || '';
        this.messages = this.normalizeMessages(response.data || []);
        this.checkConversationWindow(
          this.chat?.last_in_message_at
        );
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);
      },
      error: (err) => {
        console.log(err);
        this.loading = false;
        this.commonService.dismissLoading();
        this.commonService.showToastMessage('Unable to load messages.','toast-error','',2000);
      }
    });
  }

  private normalizeMessages(data: any[]): ChatMessage[] {
    const list = data.map(item => this.mapMessage(item));
    this.groupDateLabels(list);
    return list;
  }

  private mapMessage(item: any): ChatMessage {
    const created = new Date(item.created_at);
    return {
      id: item.id,
      direction: item.direction,
      sender:item.direction === 'OUT'? 'me': 'other',
      message_type:item.message_type || 'text',
      status:item.status || 'SENT',
      created_at:item.created_at,
      displayDate:this.formatDate(created),
      showDate: false,
      time:this.formatTime(created),
      text:item.text || '',
      renderedBody:this.renderTemplateBody(item),
      media_path:item.media_path || '',
      file_name:item.file_name || item.template?.header_file_name || '',
      // latitude:item.latitude,
      // longitude:item.longitude,
      // address:item.address,
      // location_name:item.location_name,
      // contact_name:item.contact_name,
      // contact_number:item.contact_number,
      latitude: this.getLocationData(item).latitude,
      longitude: this.getLocationData(item).longitude,
      address: this.getLocationData(item).address,
      location_name: this.getLocationData(item).location_name,
      contact_name: this.getContactData(item).contact_name,
      contact_number: this.getContactData(item).contact_number,
      template:item.template,
      parent_message:item.parent_message
    };
  }

  private getContactData(item: any): {
    contact_name: string;
    contact_number: string;
  } 
  {
    if (item.message_type !== 'contacts') {
      return {
        contact_name: '',
        contact_number: ''
      };
    }
    try {
      const data = JSON.parse(item.text || '{}');
      return {
        contact_name: data.contact_name || '',
        contact_number: data.contact_number || ''
      };
    } catch {
      return {
        contact_name: '',
        contact_number: ''
      };
    }
  }

  private getLocationData(item: any): {
    latitude: number;
    longitude: number;
    address: string;
    location_name: string;
  } {
    if (item.message_type !== 'location') {
      return {
        latitude: 0,
        longitude: 0,
        address: '',
        location_name: ''
      };
    }
    try {
      const data = JSON.parse(item.text || '{}');
      return {
        latitude: parseFloat(data.latitude || 0),
        longitude: parseFloat(data.longitude || 0),
        address: data.address || '',
        location_name: data.location_name || 'Shared Location'
      };
    } catch {
      return {
        latitude: 0,
        longitude: 0,
        address: '',
        location_name: 'Shared Location'
      };
    }
  
  }

  private groupDateLabels(messages: ChatMessage[]) {
    let previousDate = '';
    messages.forEach(msg => {
      if (msg.displayDate !== previousDate) {
        msg.showDate = true;
        previousDate = msg.displayDate;
      } else {
        msg.showDate = false;
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString([],
      {
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  private renderTemplateBody(item: any): string {

    // Normal text message
    if (item.message_type !== 'template') {
      return item.text || '';
    }
  
    if (!item.template) {
      return '';
    }
  
    let body = item.template.body_content || '';
  
    const values = item.template.body_var_values
      ? item.template.body_var_values.split(',')
      : [];
  
    body = body.replace(/{{\s*(\d+)\s*}}/g, (_:any, index:any) => {
  
      const value = values[Number(index) - 1];
  
      return value ? value.trim() : '';
  
    });
  
    body = body.replace(/(?:\r\n|\r|\n|\\n)/g, '\n');
  
    return body;
  
  }

  getReplyPreview(msg: ChatMessage): string {

    if (!msg.parent_message) {
  
      return '';
  
    }
  
    const parent = msg.parent_message;
  
    // Template
    if (parent.message_type === 'template') {
  
      let body = parent.preview_text || '';
  
      const values = parent.body_var_values
        ? parent.body_var_values.split(',')
        : [];
  
      body = body.replace(/{{\s*(\d+)\s*}}/g, (_, i) => {
  
        return values[Number(i) - 1] || '';
  
      });
  
      return body;
  
    }
  
    return parent.preview_text || '';
  
  }

  // getReplyPreview(msg: ChatMessage): string {

  //   if (!msg.parent_message) {
  
  //     return '';
  
  //   }
  
  //   const parent = msg.parent_message;
  
  //   // Parent is template
  //   if (parent.message_type === 'template') {
  
  //     let body = parent.preview_text || '';
  
  //     if (parent.body_var_values) {
  
  //       const values = parent.body_var_values.split(',');
  
  //       body = body.replace(/{{\s*(\d+)\s*}}/g, (_, i) => {
  
  //         return values[Number(i) - 1] || '';
  
  //       });
  
  //     }
  
  //     return body;
  
  //   }
  
  //   return parent.preview_text || '';
  
  // }

  getReplySender(msg: ChatMessage): string {

    if (!msg.parent_message) {
  
      return '';
  
    }
  
    return msg.sender === 'me'
  
      ? 'You'
  
      : this.contactName;
  
  }

  isForwarded(msg: ChatMessage): boolean {

    return !!(msg as any).is_forwarded;
  
  }

  getStatusIcon(msg: ChatMessage): string {
    // console.log(msg);
    switch ((msg.status || '').toLowerCase()) {
      case 'sent':
        return 'checkmark';
  
      case 'delivered':
        return 'checkmark-done';
  
      case 'read':
        return 'checkmark-done';
  
      case 'failed':
        return 'alert-circle';
  
      default:
        return 'time-outline';
    }
  }
  
  getStatusColor(msg: ChatMessage): string {
    switch ((msg.status || '').toLowerCase()) {
      case 'read':
        return '#53bdeb';
  
      case 'failed':
        return '#ff3b30';
  
      default:
        return '#667781';
    }
  }

  // getStatusIcon(msg: ChatMessage): string {
  //   console.log(msg);
  //   switch ((msg.status || '').toUpperCase()) {
  
  //     case 'READ':
  
  //       return 'checkmark-done';
  
  //     case 'DELIVERED':
  
  //       return 'checkmark-done';
  
  //     case 'FAILED':
  
  //       return 'alert-circle';
  
  //     case 'SENT':
  
  //       return 'checkmark';
  
  //     default:
  
  //       return 'time-outline';
  
  //   }
  
  // }

  // getStatusColor(msg: ChatMessage): string {

  //   switch ((msg.status || '').toUpperCase()) {
  
  //     case 'READ':
  
  //       return '#53bdeb';
  
  //     case 'DELIVERED':
  
  //       return '#667781';
  
  //     case 'FAILED':
  
  //       return '#ff3b30';
  
  //     default:
  
  //       return '#667781';
  
  //   }
  
  // }

  // get_message_list() {
  //   this.commonService.presentLoading();
  //   this.apiService.message_list(this.chat.id)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe({next: (response: any) => {
  //       this.commonService.dismissLoading();
  //       console.log('Message List', response);
  //       this.recipientNo = response.recipient_no;
  //       const mappedMessages: ChatMessage[] = [];
  //       response.data.forEach((item: any) => {
  //         const message = this.mapMessage(item);
  //         mappedMessages.push(message);
  //       });
  //       this.messages = mappedMessages;
  //       if (this.messages.length) {
  //         this.checkConversationWindow(response.data[response.data.length - 1]?.last_in_message_at ??this.chat.last_in_message_at);
  //       }
  //       setTimeout(() => {
  //         this.scrollToBottom();
  //       }, 200);
  //     },
  //     error: (error) => {
  //       console.log(error);
  //       this.commonService.dismissLoading();
  //       this.commonService.showToastMessage('Unable to load messages.','toast-error','',2000);
  //     }
  //   });
  // }

  // get_message_list() {
  //   this.commonService.presentLoading();
  //   this.apiService.message_list(this.chat.id)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe((response: any) => {console.log(response);
  //       this.commonService.dismissLoading();
  //       this.recipientNo = response.recipient_no;
  //       this.messages = response.data.map((item: any) => {
  //         const createdDate = new Date(item.created_at);
  //         let bodyText = '';
  //         if (item.message_type === 'template' && item.template) {
  //           bodyText = item.template.body_content || '';
  //           if (item.template.body_var_values) {
  //             const values = item.template.body_var_values.split(',');
  //             values.forEach((val: string, index: number) => {
  //               const regex = new RegExp(`{{${index + 1}}}`, 'g');
  //               bodyText = bodyText.replace(regex, val);
  //             });
  //           }
  //         } else {
  //           bodyText = item.text || '';
  //         }
  //         return {
  //           id: item.id,
  //           sender: item.direction === 'OUT' ? 'me' : 'other',
  //           text: bodyText,
  //           time: createdDate.toLocaleTimeString([], {
  //             hour: '2-digit',
  //             minute: '2-digit'
  //           }),
  //           displayDate: createdDate.toLocaleDateString('en-GB', {
  //             day: 'numeric',
  //             month: 'short'
  //           }),
  //           headerType: item.template?.header_type || '',
  //           headerText: item.template?.header_text || '',
  //           footer: item.template?.footer_content || '',
  //           mediaFile: item.template?.header_media_file || '',
  //           buttons: item.template?.buttons || []
  //         };
  //       });
  //       setTimeout(() => {
  //         this.scrollToBottom();
  //       }, 300);
  //     }, error => {
  //       console.log(error);
  //       this.commonService.dismissLoading();
  //     });
  // }

//   private mapMessage(item:any):ChatMessage{
//     const created=new Date(item.created_at);
//     return{
//       id:item.id,
//       direction:item.direction,
//       sender:item.direction==='OUT'?'me':'other',
//       message_type:item.message_type||'text',
//       text:item.text||'',
//       renderedBody:this.renderTemplateBody(item),
//       displayDate:created.toLocaleDateString('en-GB',{
//       day:'numeric',
//       month:'short'
//     }),
//     time:created.toLocaleTimeString([],{
//       hour:'2-digit',
//       minute:'2-digit'
//     }),
//     status:item.status||'sent',
//     media_path:item.media_path||'',
//     file_name:item.file_name ||item.template?.header_file_name || '',
//     latitude:item.latitude,
//     longitude:item.longitude,
//     address:item.address,
//     location_name:item.location_name,
//     contact_name:item.contact_name,
//     contact_number:item.contact_number,
//     // template:item.template||null,
//     template: {...item.template,header: this.getTemplateHeader(item),footer: this.getTemplateFooter(item),buttons: this.getTemplateButtons(item)},
//     parent_message:item.parent_message||null
//   };
// }

// private renderTemplateBody(item: any): string {
//   if (item.message_type !== 'template') {
//     return item.text || '';
//   }
//   if (!item.template) {
//     return item.text || '';
//   }
//   let body = item.template.body_content || '';
//   const values =
//     item.template.body_var_values
//       ? item.template.body_var_values.split(',')
//       : [];

//   body = body.replace(/{{\s*(\d+)\s*}}/g, (_:any, index:any) => {
//     return values[Number(index) - 1]
//       ? values[Number(index) - 1].trim()
//       : '';
//   });
//   body = body.replace(
//     /(?:\r\n|\r|\n|\\n)/g,
//     '\n'
//   );
//   return body;
// }

// private getTemplateHeader(item: any) {
//   if (!item.template) {return null;}
//   return {
//     type: item.template.header_type || 'none',
//     text: item.template.header_text || '',
//     media: item.template.header_media_file || '',
//     fileName:item.template.header_file_name || ''
//   };
// }

// private getTemplateFooter(item: any): string {
//   if (!item.template) {return '';}
//   return item.template.footer_content || '';
// }

// private getTemplateButtons(item: any): any[] {
//   if (!item.template) {return [];}
//   return item.template.buttons || [];
// }

  // onTemplateButtonClick(button: any) {
  //   if (button.action_type === 'URL') {
  //     window.open(button.action_value, '_blank');
  //   }

  //   if (button.action_type === 'PHONE_NUMBER') {
  //     window.open(`tel:${button.action_value}`);
  //   }

  //   if (button.action_type === 'QUICK_REPLY') {
  //     this.newMessage = button.action_value;
  //   }

  //   if (button.action_type === 'FLOW') {
  //     this.showToast('Flow button clicked');
  //   }
  // }

  // getInitials(name: string | undefined): string {
  //   if (!name) return '';
  //   const words = name.trim().split(' ');
  //   if (words.length === 1) {
  //     return words[0].charAt(0).toUpperCase();
  //   }
  //   return (
  //     words[0].charAt(0) + words[1].charAt(0)
  //   ).toUpperCase();
  // }
  getInitials(name:string | undefined):string{
    if(!name){ return '';}
    const words=name.trim().split(/\s+/);
    if(words.length===1){
      return words[0][0].toUpperCase();
    }
    return (
      words[0][0]+
      words[1][0]
    ).toUpperCase();
  }

  // send_messages() {
  //   if (!this.newMessage || !this.newMessage.trim()) {
  //     this.commonService.showToastMessage('Message can not be empty.','toast-error','',2000);
  //     return;
  //   }
  //   const tempMessage = this.newMessage;
  //   const now = new Date();
  //   // Optional: show instantly in UI before API response
  //   this.messages.push({
  //     sender: 'me',
  //     text: tempMessage,
  //     time: now.toLocaleTimeString([], {
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     }),
  //     displayDate: now.toLocaleDateString('en-GB', {
  //       day: 'numeric',
  //       month: 'short'
  //     }),
  //     footer: 'Powered by dv',
  //     buttons: [],
  //     isLocal: true
  //   });
  //   this.newMessage = '';
  //   setTimeout(() => {
  //     this.scrollToBottom();
  //   }, 200);
  //   this.commonService.presentLoading();
  //   const message: any = {
  //     recipient_no: this.recipientNo,
  //     message_type: 'text',
  //     text_message: tempMessage
  //   };
  //   console.log(message);
  //   this.apiService.send_messages(message)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe(
  //       (response: any) => {
  //         console.log(response);
  //         this.commonService.dismissLoading();
  //         // Optional: refresh message list after sending
  //         this.get_message_list();
  //       },
  //       respError => {
  //         console.log(respError);
  //         this.commonService.dismissLoading();
  //         // Remove failed local message if API fails
  //         this.messages = this.messages.filter(msg => msg.text !== tempMessage || !msg.isLocal);
  //         this.commonService.showToastMessage(respError,'toast-error','',4000);
  //       }
  //     );
  // }

  send_messages(): void {

    const message = this.newMessage.trim();
  
    if (!message) {
  
      this.commonService.showToastMessage(
        'Message cannot be empty.',
        'toast-error',
        '',
        2000
      );
  
      return;
    }
  
    const now = new Date();
  
    const tempMessage: ChatMessage = {
  
      id: Date.now(),
  
      direction: 'OUT',
  
      sender: 'me',
  
      message_type: 'text',
  
      status: 'SENT',
  
      created_at: now.toISOString(),
  
      displayDate: this.formatDate(now),
  
      showDate: false,
  
      time: this.formatTime(now),
  
      text: message,
  
      renderedBody: message,
  
      media_path: '',
  
      template: null,
  
      parent_message: null
  
    };
  
    this.messages.push(tempMessage);
  
    this.groupDateLabels(this.messages);
  
    this.newMessage = '';
  
    this.scrollToBottom();
  
    const payload = {
  
      recipient_no: this.recipientNo,
  
      message_type: 'text',
  
      text_message: message
  
    };
  
    this.apiService
      .send_messages(payload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
  
        next: (res: any) => {
  
          console.log(res);
  
          this.get_message_list();
  
        },
  
        error: err => {
  
          console.log(err);
  
          this.messages = this.messages.filter(
  
            x => x.id !== tempMessage.id
  
          );
  
          this.commonService.showToastMessage(
  
            'Unable to send message.',
  
            'toast-error',
  
            '',
  
            2000
  
          );
  
        }
  
      });
  
  }

  toggleSelect(msg: ChatMessage): void {

    if (!this.selectionMode) {
  
      return;
  
    }
  
    (msg as any).selected = !(msg as any).selected;
  
    if ((msg as any).selected) {
  
      this.selectedMessages.push(msg);
  
    }
  
    else {
  
      this.selectedMessages = this.selectedMessages.filter(
  
        x => x.id !== msg.id
  
      );
  
    }
  
  }

  enableSelection(): void {

    this.selectionMode = true;
  
  }

  clearSelection(): void {

    this.selectionMode = false;
  
    this.selectedMessages = [];
  
    this.messages.forEach(
  
      x => (x as any).selected = false
  
    );
  
  }

  deleteSelected(): void {

    const ids = this.selectedMessages.map(
  
      x => x.id
  
    );
  
    this.messages = this.messages.filter(
  
      x => !ids.includes(x.id)
  
    );
  
    this.clearSelection();
  
  }

  copyMessage(text: string): void {

    navigator.clipboard.writeText(text);
  
    this.commonService.showToastMessage(
  
      'Copied',
  
      'toast-success',
  
      '',
  
      1500
  
    );
  
  }

  exportChat(): void {

    const data = this.messages
  
      .map(
  
        x => `[${x.time}] ${x.sender}: ${x.renderedBody}`
  
      )
  
      .join('\n');
  
    const blob = new Blob(
  
      [data],
  
      {
  
        type: 'text/plain'
  
      }
  
    );
  
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
  
    a.href = url;
  
    a.download = 'chat.txt';
  
    a.click();
  
    URL.revokeObjectURL(url);
  
  }

  checkConversationWindow(lastInMessageAt: string | null): void {

    if (!lastInMessageAt) {
  
      this.showTemplateOnlyFooter = true;
  
      return;
  
    }
  
    const last = new Date(lastInMessageAt);
  
    const now = new Date();
  
    const diff =
  
      (now.getTime() - last.getTime())
  
      / (1000 * 60 * 60);
  
    this.showTemplateOnlyFooter = diff >= 24;
  
  }

  refreshMessages(event?: any): void {

    this.get_message_list();
  
    if (event) {
  
      event.target.complete();
  
    }
  
  }

  async showToast(

    message: string,
  
    color = 'success'
  
  ) {
  
    const toast = await this.toastCtrl.create({
  
      message,
  
      duration: 2000,
  
      color,
  
      position: 'bottom'
  
    });
  
    toast.present();
  
  }

  // checkConversationWindow(lastInMessageAt: string | null) {console.log(lastInMessageAt);
  //   // If no inbound message received
  //   if (!lastInMessageAt) {
  //     this.showTemplateOnlyFooter = true;
  //     return;
  //   }
  //   const lastMessageTime = new Date(lastInMessageAt).getTime();
  //   const currentTime = new Date().getTime();
  //   const hoursDifference = (currentTime - lastMessageTime) / (1000 * 60 * 60);
  //   // this.showTemplateOnlyFooter = hoursDifference >= 24;
  //   this.showTemplateOnlyFooter = hoursDifference > 24;
  // }

  // send_messages() {
  //   if (!this.newMessage) {
  //     this.commonService.showToastMessage('Message can not be empty.', 'toast-error','', 2000);
  //     return;
  //   }
  //   this.commonService.presentLoading();
  //   let message: any = {recipient_no:'', message_type:'', text_message:''};
  //   message.recipient_no = this.recipientNo;
  //   message.message_type = 'text';
  //   message.text_message = this.newMessage;
  //   console.log(message);
  //   this.apiService.send_messages(message)
  //   .pipe(takeUntil(this._unsubscribeAll))
  //   .subscribe((response:any) => {
  //     console.log(response);
  //     this.commonService.dismissLoading();
  //   },
  //   respError => {console.log(respError);
  //     this.commonService.dismissLoading();
  //     this.commonService.showToastMessage(respError, 'toast-error','', 4000);
  //   })
  // }

  onFocus() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    }, 300);
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content.scrollToBottom(300);
    }, 100);
  }

  // formatDate(date:string){
  //   return new Date(date).toLocaleDateString('en-GB',{
  //     day:'numeric',
  //     month:'short'
  //   });
  // }

  getStatus(status:string){
    switch(status){
      case 'read':
      return 'read';
      case 'delivered':
      return 'delivered';
      default:
      return 'sent';
    }
  }

  

  // async openMenuModal() {
  //   const modal = await this.modalCtrl.create({
  //     component: ChatMenuComponent,
  //     componentProps: {
  //       isMuted: this.isMuted
  //     },
  //     cssClass: 'transparent-modal'
  //   });
  //   modal.onDidDismiss().then((res:any) => {
  //     if (!res.data) return;
  
  //     this.handleMenu(res.data);
  //   });
  //   await modal.present();
  // }

  // handleMenu(action: string) {
  //   switch(action){
  //     case 'info':
  //       this.showToast('Contact Info');
  //       break;
  //     case 'select':
  //       this.selectionMode = true;
  //       this.showToast('Select Mode ON');
  //       break;
  //     case 'mute':
  //       this.isMuted = !this.isMuted;
  //       this.showToast(this.isMuted ? 'Muted' : 'Unmuted');
  //       break;
  //     case 'wallpaper':
  //       this.changeWallpaper();
  //       break;
  //     case 'export':
  //       this.exportChat();
  //       break;
  //     case 'clear':
  //       this.clearChat();
  //       break;
  //     case 'block':
  //       this.showToast('Blocked');
  //       break;
  //     case 'report':
  //       this.showToast('Reported');
  //       break;
  //   }
  // }

  // sendMessage() {
  //   if (!this.newMessage.trim()) return;
  //   const now = new Date();
  //   const time = now.toLocaleTimeString([], {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  //   // push new message
  //   this.messages.push({
  //     text: this.newMessage,
  //     sender: 'me',
  //     time: time
  //   });
  //   this.newMessage = '';
  //   setTimeout(() => {
  //     this.scrollToBottom();
  //   }, 100);
  // }

  // scrollToBottom() {
  //   this.content.scrollToBottom(300);
  // }

  // ✅ OPEN MENU
// async openMenu() {
//   const actionSheet = await this.actionSheetCtrl.create({
//     header: 'Options',
//     cssClass: 'whatsapp-menu',
//     buttons: [

//       {
//         text: 'Contact Info',
//         handler: () => {
//           this.showToast('Open Contact Info');
//         }
//       },
//       {
//         text: 'Select Messages',
//         handler: () => {
//           this.selectionMode = true;
//           this.showToast('Select messages enabled');
//         }
//       },
//       {
//         text: this.isMuted ? 'Unmute' : 'Mute',
//         handler: () => {
//           this.isMuted = !this.isMuted;
//           this.showToast(this.isMuted ? 'Chat muted' : 'Chat unmuted');
//         }
//       },
//       {
//         text: 'Wallpaper',
//         handler: () => {
//           this.changeWallpaper();
//         }
//       },
//       {
//         text: 'Export Chat',
//         handler: () => {
//           this.exportChat();
//         }
//       },
//       {
//         text: 'Clear Chat',
//         handler: () => {
//           this.clearChat();
//         }
//       },
//       {
//         text: 'Block Contact',
//         cssClass: 'danger',
//         handler: () => {
//           this.showToast('Contact blocked');
//         }
//       },
//       {
//         text: 'Report Contact',
//         cssClass: 'danger',
//         handler: () => {
//           this.showToast('Reported');
//         }
//       },
//       {
//         text: 'Cancel',
//         role: 'cancel'
//       }

//     ]
//   });

//   await actionSheet.present();
// }
// ✅ TOAST
// async showToast(msg: string) {
//   const toast = await this.toastCtrl.create({
//     message: msg,
//     duration: 1500,
//     position: 'bottom'
//   });
//   toast.present();
// }

// ✅ CLEAR CHAT
// async clearChat() {
//   const alert = await this.alertCtrl.create({
//     header: 'Clear Chat?',
//     message: 'All messages will be deleted',
//     buttons: [
//       {
//         text: 'Cancel',
//         role: 'cancel'
//       },
//       {
//         text: 'Clear',
//         handler: () => {
//           this.messages = [];
//         }
//       }
//     ]
//   });

//   await alert.present();
// }

// ✅ EXPORT CHAT
// exportChat() {
//   const data = this.messages.map(m => `${m.time} - ${m.text}`).join('\n');

//   const blob = new Blob([data], { type: 'text/plain' });
//   const url = window.URL.createObjectURL(blob);

//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'chat.txt';
//   a.click();
// }

// ✅ CHANGE WALLPAPER
changeWallpaper() {
  document.querySelector('.chat-bg')?.setAttribute(
    'style',
    "background: url('assets/images/whatsapp-bg.png')"
  );
}

// toggleSelect(msg:any){
//   if(!this.selectionMode) return;
//   msg.selected = !msg.selected;
//   if(msg.selected){
//     this.selectedMessages.push(msg);
//   } else {
//     this.selectedMessages = this.selectedMessages.filter(m => m !== msg);
//   }
// }

// =========================================================
// VIEW HELPERS (Phase 1 design) - presentation only, no behaviour change
// =========================================================

/** Keeps message rows from being rebuilt on every update (no flicker / scroll jump) */
trackMsg(index: number, msg: ChatMessage) {
  return msg?.id ?? index;
}

/** First message of a run from the same sender (or after a date label) gets the bubble tail */
isGroupStart(index: number): boolean {
  const list = this.messages || [];
  const msg = list[index];
  const prev = list[index - 1];
  return !prev || !msg || prev.sender !== msg.sender || !!msg.showDate;
}

/** Media bubbles get a fixed comfortable width; text bubbles size to their content */
isMediaType(type: string): boolean {
  return ['image', 'video', 'document', 'audio', 'voice', 'location', 'contacts'].indexOf(type) > -1;
}

/** Date label: Today / Yesterday / weekday (last 7 days), otherwise the existing "19 Nov 2026" format */
friendlyDate(msg: ChatMessage): string {
  const date = new Date(msg?.created_at);          // same parsing as mapMessage()
  if (!msg?.created_at || isNaN(date.getTime())) { return msg?.displayDate || ''; }
  const now = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days === 0) { return 'Today'; }
  if (days === 1) { return 'Yesterday'; }
  if (days > 1 && days < 7) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }
  return msg.displayDate;
}

/** Message box grows with the text (up to ~5 lines) */
autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) { return; }
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/** Shrink the message box back after sending */
resetComposer(el: HTMLTextAreaElement | null) {
  setTimeout(() => this.autoGrow(el), 0);
}

// =========================================================
// VIEW HELPERS (Phase 2 design) - UI only, no API / data changes
// =========================================================

// ---------- Scroll-to-latest button ----------
showScrollDown = false;
private seenCount = 0;

/** New messages that arrived while the user was scrolled up */
get newBelowCount(): number {
  return this.showScrollDown ? Math.max(0, (this.messages?.length || 0) - this.seenCount) : 0;
}

async onChatScroll() {
  const el = await this.content?.getScrollElement();
  if (!el) { return; }
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  const away = distance > 280;
  if (!away) { this.seenCount = this.messages?.length || 0; }
  if (away !== this.showScrollDown) { this.showScrollDown = away; }
}

jumpToLatest() {
  this.seenCount = this.messages?.length || 0;
  this.scrollToBottom();
}

// ---------- Emoji picker categories (built from the existing emojiList) ----------
emojiTab = 0;
private _emojiCategories: { icon: string; label: string; items: string[] }[] | null = null;

get emojiCategories() {
  if (!this._emojiCategories) {
    const list = this.emojiList;
    const g = list.indexOf('👋');
    const h = list.indexOf('❤️');
    const faces = g > 0 ? list.slice(0, g) : list;
    const gestures = g > 0 && h > g ? list.slice(g, h) : [];
    const symbols = h > 0 ? list.slice(h) : [];
    this._emojiCategories = [
      { icon: '😀', label: 'Smileys', items: faces },
      { icon: '👋', label: 'Gestures', items: gestures },
      { icon: '❤️', label: 'Symbols', items: symbols },
    ].filter(c => c.items.length);
  }
  return this._emojiCategories;
}

// ---------- Custom audio / voice player ----------
mediaState: { [key: string]: { playing: boolean; current: number; duration: number } } = {};
private activeAudio: HTMLAudioElement | null = null;

private stateFor(key: string) {
  if (!this.mediaState[key]) { this.mediaState[key] = { playing: false, current: 0, duration: 0 }; }
  return this.mediaState[key];
}

toggleAudio(el: HTMLAudioElement, key: string) {
  if (!el) { return; }
  if (el.paused) {
    if (this.activeAudio && this.activeAudio !== el) { this.activeAudio.pause(); }   // one at a time
    this.activeAudio = el;
    el.play().catch(() => {});
  } else {
    el.pause();
  }
}

onAudioState(el: HTMLAudioElement, key: string) {
  const st = this.stateFor(key);
  st.playing = !el.paused && !el.ended;
  st.current = el.currentTime || 0;
  st.duration = isFinite(el.duration) ? el.duration : st.duration;
}

onAudioEnded(el: HTMLAudioElement, key: string) {
  const st = this.stateFor(key);
  st.playing = false;
  st.current = 0;
  el.currentTime = 0;
}

seekAudio(el: HTMLAudioElement, key: string, event: any) {
  const value = Number(event?.target?.value || 0);
  if (el && isFinite(el.duration)) {
    el.currentTime = (value / 100) * el.duration;
    this.onAudioState(el, key);
  }
}

audioProgress(key: string): number {
  const st = this.mediaState[key];
  return st && st.duration ? (st.current / st.duration) * 100 : 0;
}

/** Shows elapsed time while playing/paused mid-way, otherwise the total length */
audioTimeLabel(key: string): string {
  const st = this.mediaState[key];
  if (!st) { return '0:00'; }
  return this.formatDuration(st.playing || st.current ? st.current : st.duration);
}

formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) { return '0:00'; }
  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// ---------- Video: clean poster with a play button, native controls after tap ----------
videoStarted: { [key: string]: boolean } = {};

playVideo(el: HTMLVideoElement, key: string) {
  if (!el) { return; }
  this.videoStarted[key] = true;
  if (this.activeAudio) { this.activeAudio.pause(); }
  el.play().catch(() => {});
}

// =========================================================
// PHASE 3 HELPERS - long-press menu + map URL (no API / data changes)
// =========================================================

/** Same Static Maps URL as before; the key now comes from environment.ts */
getStaticMapUrl(lat: number | undefined, lng: number | undefined): string {
  return 'https://maps.googleapis.com/maps/api/staticmap?center=' +
    lat + ',' + lng +
    '&zoom=16&size=600x260' +
    '&markers=color:red|' +
    lat + ',' + lng +
    '&key=' + environment.googleMapsStaticKey;
}

// ---------- Long-press on a message -> action sheet (Copy) ----------
pressedMsgId: number | null = null;
private pressTimer: any = null;
private pressFired = false;
private sheetOpen = false;

/** Text that can be copied from a message (template body or plain text) */
private copyableText(msg: ChatMessage): string {
  const text = msg?.message_type === 'template' ? msg?.renderedBody : msg?.text;
  return (text || '').toString().trim();
}

pressStart(msg: ChatMessage) {
  this.pressFired = false;
  clearTimeout(this.pressTimer);
  this.pressTimer = setTimeout(() => {
    this.pressFired = true;
    this.openMessageActions(msg);
  }, 450);
}

pressEnd(event?: Event) {
  clearTimeout(this.pressTimer);
  if (this.pressFired && event?.cancelable) {
    event.preventDefault();   // don't also "tap" the image / button under the finger
  }
}

pressCancel() {
  clearTimeout(this.pressTimer);
}

/** Right-click on desktop, and the long-press menu event on some phones */
onMessageContext(msg: ChatMessage, event: Event) {
  event.preventDefault();
  if (this.pressFired) { return; }   // already opened by the touch long-press
  this.openMessageActions(msg);
}

async openMessageActions(msg: ChatMessage) {
  const text = this.copyableText(msg);
  if (!text || this.sheetOpen) { return; }
  this.sheetOpen = true;
  this.pressedMsgId = msg.id;
  try { (navigator as any).vibrate?.(12); } catch (e) { /* not supported */ }

  const sheet = await this.actionSheetCtrl.create({
    cssClass: 'cd-action-sheet',
    buttons: [
      { text: 'Copy', icon: 'copy-outline', handler: () => this.copyMessage(text) },
      { text: 'Cancel', icon: 'close', role: 'cancel' },
    ],
  });
  sheet.onDidDismiss().then(() => {
    this.sheetOpen = false;
    this.pressedMsgId = null;
    this.pressFired = false;
  });
  await sheet.present();
}

goToTemplate() {
  this.router.navigateByUrl('select-template');
}

ionViewDidEnter() {
  this.backButtonSub = this.platform.backButton.subscribeWithPriority(9999, () => {
    this.onBack();
    // (navigator as any).app.exitApp();
  });
}

ionViewWillLeave() {
  if (this.backButtonSub) {
    this.backButtonSub.unsubscribe();
  }
}
onBack() {console.log(this.chat);
  if(this.chat!==null){
    if(this.chat.routeURL=='contact'){
      this.router.navigateByUrl('contact-list');
    }
    // else if(this.chat.routeURL=='contact-details'){
    //   this.router.navigateByUrl('contact-detail');
    // }
    else{
      this.router.navigateByUrl('home');
    }
  }
  else{
    this.router.navigateByUrl('home');
  }
}




// NEW

openImage(url?: string | null ) {
  if (!url) {
    return;
  }
  window.open(url, '_blank');
}

downloadFile(url?: string | null, fileName?: string): void {

  if (!url) {

    this.commonService.showToastMessage(
      'File not found.',
      'toast-error',
      '',
      2000
    );

    return;
  }

  const link = document.createElement('a');

  link.href = url;

  link.target = '_blank';

  if (fileName) {
    link.download = fileName;
  }

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

}

// downloadFile(url: string, fileName?: string) {

//   if (!url) {
//     return;
//   }

//   const link = document.createElement('a');
//   link.href = url;
//   link.download = fileName || 'download';
//   link.target = '_blank';
//   link.click();

// }



openLocation(lat: number | undefined, lng: number | undefined): void {

  if (!lat || !lng) {
    return;
  }

  const url = `https://www.google.com/maps?q=${lat},${lng}`;

  window.open(url, '_system');

}

callContact(number: string | undefined) {

  if (!number) {
    return;
  }

  window.open(`tel:${number}`, '_system');

}

saveContact(name: string | undefined, number: string | undefined): void {

  if (!number) {

    return;

  }

  const vcard =
`BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${number}
END:VCARD`;

  const blob = new Blob(
    [vcard],
    { type: 'text/vcard' }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;

  link.download = `${name}.vcf`;

  link.click();

  URL.revokeObjectURL(url);

}

openVideo(videoUrl: string): void {

  if (!videoUrl) {
    return;
  }

  window.open(videoUrl, '_blank');

}

playAudio(audio: HTMLAudioElement): void {

  if (!audio) {
    return;
  }

  audio.play();

}

stopAudio(audio: HTMLAudioElement): void {

  if (!audio) {
    return;
  }

  audio.pause();

  audio.currentTime = 0;

}

onTemplateButtonClick(button: any): void {

  if (!button) {
    return;
  }

  switch (button.action_type) {

    case 'URL':

      window.open(button.action_value, '_blank');

      break;

    case 'PHONE_NUMBER':

      window.open(
        `tel:${button.action_value}`,
        '_system'
      );

      break;

    case 'QUICK_REPLY':

      this.newMessage = button.action_value || button.label;

      break;

    case 'FLOW':

      this.commonService.showToastMessage(
        'Flow action clicked.',
        'toast-success',
        '',
        2000
      );

      break;

    default:

      console.log(button);

  }

}

getDocumentIcon(fileName: string): string {

  if (!fileName) {

    return 'document-text-outline';

  }

  const ext = fileName
    .split('.')
    .pop()
    ?.toLowerCase();

  switch (ext) {

    case 'pdf':
      return 'document-text-outline';

    case 'xls':

    case 'xlsx':

    case 'csv':
      return 'grid-outline';

    case 'doc':

    case 'docx':
      return 'document-outline';

    case 'ppt':

    case 'pptx':
      return 'easel-outline';

    case 'zip':

    case 'rar':
      return 'archive-outline';

    default:
      return 'document-text-outline';

  }

}

isImage(msg: ChatMessage): boolean {

  return msg.message_type === 'image';

}

isVideo(msg: ChatMessage): boolean {

  return msg.message_type === 'video';

}

isAudio(msg: ChatMessage): boolean {

  return msg.message_type === 'audio';

}

isDocument(msg: ChatMessage): boolean {

  return msg.message_type === 'document';

}

isLocation(msg: ChatMessage): boolean {

  return msg.message_type === 'location';

}

isContact(msg: ChatMessage): boolean {

  return msg.message_type === 'contacts';

}
getImageUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return this.imgURL + path;
}
 makeCall() {
  if (!this.recipientNo) {
    this.commonService.showToastMessage(
      'Contact number not available.',
      'toast-error',
      '',
      2000
    );
    return;
  }

  window.open(`tel:${this.recipientNo}`, '_system');
}
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.newMessage = (this.newMessage || '') + emoji;
    this.showEmojiPicker = false;
  }

  openCamera(): void {
    this.cameraInput?.nativeElement?.click();
  }

  onCameraSelected(event: Event): void {
    // const input = event.target as HTMLInputElement;
    // const file = input.files?.[0];

    // if (!file) {
    //   return;
    // }

    // // No media-upload API is present in this page, so no API payload is fabricated.
    // // This makes the device/browser camera/file picker functional without changing
    // // your existing send_messages() integration.
    // this.commonService.showToastMessage(
    //   `${file.name} selected`,
    //   'toast-success',
    //   '',
    //   1500
    // );

    // input.value = '';
  }

  openAttachment() {
    // Existing attachment behavior intentionally left unchanged.
    console.log('Attachment clicked');
  }

getFileName(path: string | null | undefined): string {
  if (!path) {
    return 'Document';
  }

  return path.substring(path.lastIndexOf('/') + 1);
}
  // async presentMenuOptions() {
  //   const actionSheet = await this.actionSheetCtrl.create({
  //     header: 'Options',
  //     buttons: [
  //       {
  //         text: 'Edit Profile',
  //         icon: 'create-outline',
  //         handler: () => {
  //           this.toggleEdit();
  //         }
  //       },
  //       {
  //         text: 'Logout',
  //         role: 'destructive',
  //         icon: 'log-out-outline',
  //         handler: () => {
  //           this.logout();
  //         }
  //       },
  //       {
  //         text: 'Cancel',
  //         icon: 'close',
  //         role: 'cancel'
  //       }
  //     ]
  //   });
  //   await actionSheet.present();
  // }
  //   toggleEdit() {
  //   this.isEdit = true;
  //   this.tempUser = { ...this.user };
  // }
  //   logout() {
  //   this.userService.clearCurrentUser();
  //   this.clearUserData();
  //   this.router.navigateByUrl('login');
  // }




}





















































































// *TS*
// import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
// import { NavigationEnd, Router } from '@angular/router';
// import { ActionSheetController, AlertController, IonContent, ModalController, ToastController } from '@ionic/angular';
// import { ChatMenuComponent } from '../chat-menu/chat-menu.component';
// import { filter, Subject, takeUntil } from 'rxjs';
// import { Api } from '../api';
// import { Common } from '../common';
// import { User } from '../user';

// export interface ChatButton {
//   d?: number;
//   action_type: string;
//   action_value: string;
//   label: string;
// }
// export interface ChatTemplate {
//   id?: number;
//   header_type?: string;
//   header_text?: string;
//   header_media_file?: string;
//   header_file_name?: string;
//   body_content?: string;
//   // body_var_count?: number;
//   // body_var_names?: string;
//   body_var_values?: string;
//   footer_content?: string;
//   buttons?: ChatButton[];
// }
// export interface ParentMessage {
//   id?: number;
//   message_type?: string;
//   sender_name?: string;
//   preview_text?: string;
//   body_var_values?: string;
// }

// export interface ChatMessage {
//   id:number;
//   direction:'IN'|'OUT';
//   sender:'me'|'other';
//   message_type:string;
//   status:string;
//   created_at:string;
//   displayDate:string;
//   showDate:boolean;
//   time:string;
//   text:string;
//   renderedBody:string;
//   media_path?:string;
//   file_name?:string;
//   latitude?:number;
//   longitude?:number;
//   address?:string;
//   location_name?:string;
//   contact_name?:string;
//   contact_number?:string;
//   template?:ChatTemplate|null;
//   parent_message?:ParentMessage|null;
// }

// @Component({
//   selector: 'app-chat-details',
//   templateUrl: './chat-details.page.html',
//   styleUrls: ['./chat-details.page.scss'],
//   standalone: false,
// })
// export class ChatDetailsPage implements OnInit, OnDestroy {

//   private _unsubscribeAll: Subject<any>;

  // @ViewChild(IonContent) content!: IonContent;
  // @ViewChild(IonContent,{static:false})
  // content!:IonContent;
  // // @ViewChild('content', { static: false }) content!: IonContent;
  // currentUser:any;
  // chat: any;
  // recipientNo: string = '';
  // newMessage: string = '';
  // contactName: string = '';
  // messages: ChatMessage[] = [];
  // loading = false;
  // messages: any[] = [
  //   {
  //     text: 'Hello 👋',
  //     sender: 'other',
  //     time: '10:10 am'
  //   },
  //   {
  //     text: 'Hi, how are you?',
  //     sender: 'me',
  //     time: '10:11 am'
  //   },
  //   {
  //     text: 'I am good 😊',
  //     sender: 'other',
  //     time: '10:12 am'
  //   }
  // ];
  // isMuted = false;
  // selectionMode = false;
  // showTemplateOnlyFooter = false;
  // today = new Date();
  // selectedMessages: ChatMessage[] = [];
  // imgURL = 'https://dvchat.dvworks.in';

  // constructor(private router: Router, private modalCtrl: ModalController,private actionSheetCtrl: ActionSheetController,private alertCtrl: AlertController,
  //   private toastCtrl: ToastController, private userService: User, private commonService: Common, private apiService: Api) { 
  //   this._unsubscribeAll = new Subject();
  //   const nav = this.router.getCurrentNavigation();
  //   this.chat = nav?.extras?.state?.['chat'];
  //   if(this.chat){
  //     this.contactName = this.chat.contacts__name ||''  ;
  //   }
  //   console.log(this.chat);
  //   this.checkConversationWindow(this.chat.last_in_message_at);
  // }

  // ngOnInit() {
  //   this.userService.currentUser$.subscribe(user => {
  //     if (user) {
  //       this.currentUser = user;
  //       console.log('39',this.currentUser);
  //     } 
  //     else {
  //       const storedUser = localStorage.getItem('currentUser');
  //       if (storedUser) {
  //         this.currentUser = JSON.parse(storedUser);
  //         console.log('44',this.currentUser);
  //       }
  //     }
  //   });
  //   this.get_message_list();
  //   this.scrollToBottom();
  // }

  // ngOnDestroy(): void {
  //   this._unsubscribeAll.next(null);
  //   this._unsubscribeAll.complete();
  // }

  // get_message_list() {
  //   this.loading = true;
  //   this.commonService.presentLoading();
  //   this.apiService.message_list(this.chat.id)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe({next: (response: any) => {
  //       this.loading = false;
  //       this.commonService.dismissLoading();
  //       console.log('Message Response', response);
  //       this.recipientNo = response.recipient_no || '';
  //       this.messages = this.normalizeMessages(response.data || []);
  //       this.checkConversationWindow(
  //         this.chat?.last_in_message_at
  //       );
  //       setTimeout(() => {
  //         this.scrollToBottom();
  //       }, 200);
  //     },
  //     error: (err) => {
  //       console.log(err);
  //       this.loading = false;
  //       this.commonService.dismissLoading();
  //       this.commonService.showToastMessage('Unable to load messages.','toast-error','',2000);
  //     }
  //   });
  // }

  // private normalizeMessages(data: any[]): ChatMessage[] {
  //   const list = data.map(item => this.mapMessage(item));
  //   this.groupDateLabels(list);
  //   return list;
  // }

  // private mapMessage(item: any): ChatMessage {
  //   const created = new Date(item.created_at);
  //   return {
  //     id: item.id,
  //     direction: item.direction,
  //     sender:item.direction === 'OUT'? 'me': 'other',
  //     message_type:item.message_type || 'text',
  //     status:item.status || 'SENT',
  //     created_at:item.created_at,
  //     displayDate:this.formatDate(created),
  //     showDate: false,
  //     time:this.formatTime(created),
  //     text:item.text || '',
  //     renderedBody:this.renderTemplateBody(item),
  //     media_path:item.media_path || '',
  //     file_name:item.file_name || item.template?.header_file_name || '',
      // latitude:item.latitude,
      // longitude:item.longitude,
      // address:item.address,
      // location_name:item.location_name,
      // contact_name:item.contact_name,
      // contact_number:item.contact_number,
  //     latitude: this.getLocationData(item).latitude,
  //     longitude: this.getLocationData(item).longitude,
  //     address: this.getLocationData(item).address,
  //     location_name: this.getLocationData(item).location_name,
  //     contact_name: this.getContactData(item).contact_name,
  //     contact_number: this.getContactData(item).contact_number,
  //     template:item.template,
  //     parent_message:item.parent_message
  //   };
  // }

  // private getContactData(item: any): {
  //   contact_name: string;
  //   contact_number: string;
  // } 
  // {
  //   if (item.message_type !== 'contacts') {
  //     return {
  //       contact_name: '',
  //       contact_number: ''
  //     };
  //   }
  //   try {
  //     const data = JSON.parse(item.text || '{}');
  //     return {
  //       contact_name: data.contact_name || '',
  //       contact_number: data.contact_number || ''
  //     };
  //   } catch {
  //     return {
  //       contact_name: '',
  //       contact_number: ''
  //     };
  //   }
  // }

  // private getLocationData(item: any): {
  //   latitude: number;
  //   longitude: number;
  //   address: string;
  //   location_name: string;
  // } {
  //   if (item.message_type !== 'location') {
  //     return {
  //       latitude: 0,
  //       longitude: 0,
  //       address: '',
  //       location_name: ''
  //     };
  //   }
  //   try {
  //     const data = JSON.parse(item.text || '{}');
  //     return {
  //       latitude: parseFloat(data.latitude || 0),
  //       longitude: parseFloat(data.longitude || 0),
  //       address: data.address || '',
  //       location_name: data.location_name || 'Shared Location'
  //     };
  //   } catch {
  //     return {
  //       latitude: 0,
  //       longitude: 0,
  //       address: '',
  //       location_name: 'Shared Location'
  //     };
  //   }
  
  // }

  // private groupDateLabels(messages: ChatMessage[]) {
  //   let previousDate = '';
  //   messages.forEach(msg => {
  //     if (msg.displayDate !== previousDate) {
  //       msg.showDate = true;
  //       previousDate = msg.displayDate;
  //     } else {
  //       msg.showDate = false;
  //     }
  //   });
  // }

  // private formatDate(date: Date): string {
  //   return date.toLocaleDateString('en-GB',
  //     {
  //       day: 'numeric',
  //       month: 'short',
  //       year: 'numeric'
  //     }
  //   );
  // }

  // private formatTime(date: Date): string {
  //   return date.toLocaleTimeString([],
  //     {
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     }
  //   );
  // }

  // private renderTemplateBody(item: any): string {

  //   // Normal text message
  //   if (item.message_type !== 'template') {
  //     return item.text || '';
  //   }
  
  //   if (!item.template) {
  //     return '';
  //   }
  
  //   let body = item.template.body_content || '';
  
  //   const values = item.template.body_var_values
  //     ? item.template.body_var_values.split(',')
  //     : [];
  
  //   body = body.replace(/{{\s*(\d+)\s*}}/g, (_:any, index:any) => {
  
  //     const value = values[Number(index) - 1];
  
  //     return value ? value.trim() : '';
  
  //   });
  
  //   body = body.replace(/(?:\r\n|\r|\n|\\n)/g, '\n');
  
  //   return body;
  
  // }

  // getReplyPreview(msg: ChatMessage): string {

  //   if (!msg.parent_message) {
  
  //     return '';
  
  //   }
  
  //   const parent = msg.parent_message;
  
  //   // Template
  //   if (parent.message_type === 'template') {
  
  //     let body = parent.preview_text || '';
  
  //     const values = parent.body_var_values
  //       ? parent.body_var_values.split(',')
  //       : [];
  
  //     body = body.replace(/{{\s*(\d+)\s*}}/g, (_, i) => {
  
  //       return values[Number(i) - 1] || '';
  
  //     });
  
  //     return body;
  
  //   }
  
  //   return parent.preview_text || '';
  
  // }

  // getReplyPreview(msg: ChatMessage): string {

  //   if (!msg.parent_message) {
  
  //     return '';
  
  //   }
  
  //   const parent = msg.parent_message;
  
  //   // Parent is template
  //   if (parent.message_type === 'template') {
  
  //     let body = parent.preview_text || '';
  
  //     if (parent.body_var_values) {
  
  //       const values = parent.body_var_values.split(',');
  
  //       body = body.replace(/{{\s*(\d+)\s*}}/g, (_, i) => {
  
  //         return values[Number(i) - 1] || '';
  
  //       });
  
  //     }
  
  //     return body;
  
  //   }
  
  //   return parent.preview_text || '';
  
  // }

  // getReplySender(msg: ChatMessage): string {

  //   if (!msg.parent_message) {
  
  //     return '';
  
  //   }
  
  //   return msg.sender === 'me'
  
  //     ? 'You'
  
  //     : this.contactName;
  
  // }

  // isForwarded(msg: ChatMessage): boolean {

  //   return !!(msg as any).is_forwarded;
  
  // }

  // getStatusIcon(msg: ChatMessage): string {
  //   console.log(msg);
  //   switch ((msg.status || '').toLowerCase()) {
  //     case 'sent':
  //       return 'checkmark';
  
  //     case 'delivered':
  //       return 'checkmark-done';
  
  //     case 'read':
  //       return 'checkmark-done';
  
  //     case 'failed':
  //       return 'alert-circle';
  
  //     default:
  //       return 'time-outline';
  //   }
  // }
  
  // getStatusColor(msg: ChatMessage): string {
  //   switch ((msg.status || '').toLowerCase()) {
  //     case 'read':
  //       return '#53bdeb';
  
  //     case 'failed':
  //       return '#ff3b30';
  
  //     default:
  //       return '#667781';
  //   }
  // }

  // getStatusIcon(msg: ChatMessage): string {
  //   console.log(msg);
  //   switch ((msg.status || '').toUpperCase()) {
  
  //     case 'READ':
  
  //       return 'checkmark-done';
  
  //     case 'DELIVERED':
  
  //       return 'checkmark-done';
  
  //     case 'FAILED':
  
  //       return 'alert-circle';
  
  //     case 'SENT':
  
  //       return 'checkmark';
  
  //     default:
  
  //       return 'time-outline';
  
  //   }
  
  // }

  // getStatusColor(msg: ChatMessage): string {

  //   switch ((msg.status || '').toUpperCase()) {
  
  //     case 'READ':
  
  //       return '#53bdeb';
  
  //     case 'DELIVERED':
  
  //       return '#667781';
  
  //     case 'FAILED':
  
  //       return '#ff3b30';
  
  //     default:
  
  //       return '#667781';
  
  //   }
  
  // }

  // get_message_list() {
  //   this.commonService.presentLoading();
  //   this.apiService.message_list(this.chat.id)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe({next: (response: any) => {
  //       this.commonService.dismissLoading();
  //       console.log('Message List', response);
  //       this.recipientNo = response.recipient_no;
  //       const mappedMessages: ChatMessage[] = [];
  //       response.data.forEach((item: any) => {
  //         const message = this.mapMessage(item);
  //         mappedMessages.push(message);
  //       });
  //       this.messages = mappedMessages;
  //       if (this.messages.length) {
  //         this.checkConversationWindow(response.data[response.data.length - 1]?.last_in_message_at ??this.chat.last_in_message_at);
  //       }
  //       setTimeout(() => {
  //         this.scrollToBottom();
  //       }, 200);
  //     },
  //     error: (error) => {
  //       console.log(error);
  //       this.commonService.dismissLoading();
  //       this.commonService.showToastMessage('Unable to load messages.','toast-error','',2000);
  //     }
  //   });
  // }

  // get_message_list() {
  //   this.commonService.presentLoading();
  //   this.apiService.message_list(this.chat.id)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe((response: any) => {console.log(response);
  //       this.commonService.dismissLoading();
  //       this.recipientNo = response.recipient_no;
  //       this.messages = response.data.map((item: any) => {
  //         const createdDate = new Date(item.created_at);
  //         let bodyText = '';
  //         if (item.message_type === 'template' && item.template) {
  //           bodyText = item.template.body_content || '';
  //           if (item.template.body_var_values) {
  //             const values = item.template.body_var_values.split(',');
  //             values.forEach((val: string, index: number) => {
  //               const regex = new RegExp(`{{${index + 1}}}`, 'g');
  //               bodyText = bodyText.replace(regex, val);
  //             });
  //           }
  //         } else {
  //           bodyText = item.text || '';
  //         }
  //         return {
  //           id: item.id,
  //           sender: item.direction === 'OUT' ? 'me' : 'other',
  //           text: bodyText,
  //           time: createdDate.toLocaleTimeString([], {
  //             hour: '2-digit',
  //             minute: '2-digit'
  //           }),
  //           displayDate: createdDate.toLocaleDateString('en-GB', {
  //             day: 'numeric',
  //             month: 'short'
  //           }),
  //           headerType: item.template?.header_type || '',
  //           headerText: item.template?.header_text || '',
  //           footer: item.template?.footer_content || '',
  //           mediaFile: item.template?.header_media_file || '',
  //           buttons: item.template?.buttons || []
  //         };
  //       });
  //       setTimeout(() => {
  //         this.scrollToBottom();
  //       }, 300);
  //     }, error => {
  //       console.log(error);
  //       this.commonService.dismissLoading();
  //     });
  // }

//   private mapMessage(item:any):ChatMessage{
//     const created=new Date(item.created_at);
//     return{
//       id:item.id,
//       direction:item.direction,
//       sender:item.direction==='OUT'?'me':'other',
//       message_type:item.message_type||'text',
//       text:item.text||'',
//       renderedBody:this.renderTemplateBody(item),
//       displayDate:created.toLocaleDateString('en-GB',{
//       day:'numeric',
//       month:'short'
//     }),
//     time:created.toLocaleTimeString([],{
//       hour:'2-digit',
//       minute:'2-digit'
//     }),
//     status:item.status||'sent',
//     media_path:item.media_path||'',
//     file_name:item.file_name ||item.template?.header_file_name || '',
//     latitude:item.latitude,
//     longitude:item.longitude,
//     address:item.address,
//     location_name:item.location_name,
//     contact_name:item.contact_name,
//     contact_number:item.contact_number,
//     // template:item.template||null,
//     template: {...item.template,header: this.getTemplateHeader(item),footer: this.getTemplateFooter(item),buttons: this.getTemplateButtons(item)},
//     parent_message:item.parent_message||null
//   };
// }

// private renderTemplateBody(item: any): string {
//   if (item.message_type !== 'template') {
//     return item.text || '';
//   }
//   if (!item.template) {
//     return item.text || '';
//   }
//   let body = item.template.body_content || '';
//   const values =
//     item.template.body_var_values
//       ? item.template.body_var_values.split(',')
//       : [];

//   body = body.replace(/{{\s*(\d+)\s*}}/g, (_:any, index:any) => {
//     return values[Number(index) - 1]
//       ? values[Number(index) - 1].trim()
//       : '';
//   });
//   body = body.replace(
//     /(?:\r\n|\r|\n|\\n)/g,
//     '\n'
//   );
//   return body;
// }

// private getTemplateHeader(item: any) {
//   if (!item.template) {return null;}
//   return {
//     type: item.template.header_type || 'none',
//     text: item.template.header_text || '',
//     media: item.template.header_media_file || '',
//     fileName:item.template.header_file_name || ''
//   };
// }

// private getTemplateFooter(item: any): string {
//   if (!item.template) {return '';}
//   return item.template.footer_content || '';
// }

// private getTemplateButtons(item: any): any[] {
//   if (!item.template) {return [];}
//   return item.template.buttons || [];
// }

  // onTemplateButtonClick(button: any) {
  //   if (button.action_type === 'URL') {
  //     window.open(button.action_value, '_blank');
  //   }

  //   if (button.action_type === 'PHONE_NUMBER') {
  //     window.open(`tel:${button.action_value}`);
  //   }

  //   if (button.action_type === 'QUICK_REPLY') {
  //     this.newMessage = button.action_value;
  //   }

  //   if (button.action_type === 'FLOW') {
  //     this.showToast('Flow button clicked');
  //   }
  // }

  // getInitials(name: string | undefined): string {
  //   if (!name) return '';
  //   const words = name.trim().split(' ');
  //   if (words.length === 1) {
  //     return words[0].charAt(0).toUpperCase();
  //   }
  //   return (
  //     words[0].charAt(0) + words[1].charAt(0)
  //   ).toUpperCase();
  // }
  // getInitials(name:string | undefined):string{
  //   if(!name){ return '';}
  //   const words=name.trim().split(/\s+/);
  //   if(words.length===1){
  //     return words[0][0].toUpperCase();
  //   }
  //   return (
  //     words[0][0]+
  //     words[1][0]
  //   ).toUpperCase();
  // }

  // send_messages() {
  //   if (!this.newMessage || !this.newMessage.trim()) {
  //     this.commonService.showToastMessage('Message can not be empty.','toast-error','',2000);
  //     return;
  //   }
  //   const tempMessage = this.newMessage;
  //   const now = new Date();
  //   // Optional: show instantly in UI before API response
  //   this.messages.push({
  //     sender: 'me',
  //     text: tempMessage,
  //     time: now.toLocaleTimeString([], {
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     }),
  //     displayDate: now.toLocaleDateString('en-GB', {
  //       day: 'numeric',
  //       month: 'short'
  //     }),
  //     footer: 'Powered by dv',
  //     buttons: [],
  //     isLocal: true
  //   });
  //   this.newMessage = '';
  //   setTimeout(() => {
  //     this.scrollToBottom();
  //   }, 200);
  //   this.commonService.presentLoading();
  //   const message: any = {
  //     recipient_no: this.recipientNo,
  //     message_type: 'text',
  //     text_message: tempMessage
  //   };
  //   console.log(message);
  //   this.apiService.send_messages(message)
  //     .pipe(takeUntil(this._unsubscribeAll))
  //     .subscribe(
  //       (response: any) => {
  //         console.log(response);
  //         this.commonService.dismissLoading();
  //         // Optional: refresh message list after sending
  //         this.get_message_list();
  //       },
  //       respError => {
  //         console.log(respError);
  //         this.commonService.dismissLoading();
  //         // Remove failed local message if API fails
  //         this.messages = this.messages.filter(msg => msg.text !== tempMessage || !msg.isLocal);
  //         this.commonService.showToastMessage(respError,'toast-error','',4000);
  //       }
  //     );
  // }

// send_messages(): void {

//   const message = this.newMessage.trim();

//   if(!message) {

//     this.commonService.showToastMessage(
//       'Message cannot be empty.',
//         'toast-error',
//         '',
//         2000
//       );
  
//       return;
//     }
  
//     const now = new Date();
  
//     const tempMessage: ChatMessage = {
  
//       id: Date.now(),
  
//       direction: 'OUT',
  
//       sender: 'me',
  
//       message_type: 'text',
  
//       status: 'SENT',
  
//       created_at: now.toISOString(),
  
//       displayDate: this.formatDate(now),
  
//       showDate: false,
  
//       time: this.formatTime(now),
  
//       text: message,
  
//       renderedBody: message,
  
//       media_path: '',
  
//       template: null,
  
//       parent_message: null
  
//     };
  
//     this.messages.push(tempMessage);
  
//     this.groupDateLabels(this.messages);
  
//     this.newMessage = '';
  
//     this.scrollToBottom();
  
//     const payload = {
  
//       recipient_no: this.recipientNo,
  
//       message_type: 'text',
  
//       text_message: message
  
//     };
  
//     this.apiService
//       .send_messages(payload)
//       .pipe(takeUntil(this._unsubscribeAll))
//       .subscribe({
  
//         next: (res: any) => {
  
//           console.log(res);
  
//           this.get_message_list();
  
//         },
  
//         error: err => {
  
//           console.log(err);
  
//           this.messages = this.messages.filter(
  
//             x => x.id !== tempMessage.id
  
//           );
  
//           this.commonService.showToastMessage(
  
//             'Unable to send message.',
  
//             'toast-error',
  
//             '',
  
//             2000
  
//           );
  
//         }
  
//       });
  
//   }

//   toggleSelect(msg: ChatMessage): void {

//     if (!this.selectionMode) {
  
//       return;
  
//     }
  
//     (msg as any).selected = !(msg as any).selected;
  
//     if ((msg as any).selected) {
  
//       this.selectedMessages.push(msg);
  
//     }
  
//     else {
  
//       this.selectedMessages = this.selectedMessages.filter(
  
//         x => x.id !== msg.id
  
//       );
  
//     }
  
//   }

//   enableSelection(): void {

//     this.selectionMode = true;
  
//   }

//   clearSelection(): void {

//     this.selectionMode = false;
  
//     this.selectedMessages = [];
  
//     this.messages.forEach(
  
//       x => (x as any).selected = false
  
//     );
  
//   }

//   deleteSelected(): void {

//     const ids = this.selectedMessages.map(
  
//       x => x.id
  
//     );
  
//     this.messages = this.messages.filter(
  
//       x => !ids.includes(x.id)
  
//     );
  
//     this.clearSelection();
  
//   }

//   copyMessage(text: string): void {

//     navigator.clipboard.writeText(text);
  
//     this.commonService.showToastMessage(
  
//       'Copied',
  
//       'toast-success',
  
//       '',
  
//       1500
  
//     );
  
//   }

//   exportChat(): void {

//     const data = this.messages
  
//       .map(
  
//         x => `[${x.time}] ${x.sender}: ${x.renderedBody}`
  
//       )
  
//       .join('\n');
  
//     const blob = new Blob(
  
//       [data],
  
//       {
  
//         type: 'text/plain'
  
//       }
  
//     );
  
//     const url = URL.createObjectURL(blob);
  
//     const a = document.createElement('a');
  
//     a.href = url;
  
//     a.download = 'chat.txt';
  
//     a.click();
  
//     URL.revokeObjectURL(url);
  
//   }

//   checkConversationWindow(lastInMessageAt: string | null): void {

//     if (!lastInMessageAt) {
  
//       this.showTemplateOnlyFooter = true;
  
//       return;
  
//     }
  
//     const last = new Date(lastInMessageAt);
  
//     const now = new Date();
  
//     const diff =
  
//       (now.getTime() - last.getTime())
  
//       / (1000 * 60 * 60);
  
//     this.showTemplateOnlyFooter = diff >= 24;
  
//   }

//   refreshMessages(event?: any): void {

//     this.get_message_list();
  
//     if (event) {
  
//       event.target.complete();
  
//     }
  
//   }

//   async showToast(

//     message: string,
  
//     color = 'success'
  
//   ) {
  
//     const toast = await this.toastCtrl.create({
  
//       message,
  
//       duration: 2000,
  
//       color,
  
//       position: 'bottom'
  
//     });
  
//     toast.present();
  
//   }

  // checkConversationWindow(lastInMessageAt: string | null) {console.log(lastInMessageAt);
  //   // If no inbound message received
  //   if (!lastInMessageAt) {
  //     this.showTemplateOnlyFooter = true;
  //     return;
  //   }
  //   const lastMessageTime = new Date(lastInMessageAt).getTime();
  //   const currentTime = new Date().getTime();
  //   const hoursDifference = (currentTime - lastMessageTime) / (1000 * 60 * 60);
  //   // this.showTemplateOnlyFooter = hoursDifference >= 24;
  //   this.showTemplateOnlyFooter = hoursDifference > 24;
  // }

  // send_messages() {
  //   if (!this.newMessage) {
  //     this.commonService.showToastMessage('Message can not be empty.', 'toast-error','', 2000);
  //     return;
  //   }
  //   this.commonService.presentLoading();
  //   let message: any = {recipient_no:'', message_type:'', text_message:''};
  //   message.recipient_no = this.recipientNo;
  //   message.message_type = 'text';
  //   message.text_message = this.newMessage;
  //   console.log(message);
  //   this.apiService.send_messages(message)
  //   .pipe(takeUntil(this._unsubscribeAll))
  //   .subscribe((response:any) => {
  //     console.log(response);
  //     this.commonService.dismissLoading();
  //   },
  //   respError => {console.log(respError);
  //     this.commonService.dismissLoading();
  //     this.commonService.showToastMessage(respError, 'toast-error','', 4000);
  //   })
  // }

  // onFocus() {
  //   setTimeout(() => {
  //     this.content.scrollToBottom(300);
  //   }, 300);
  // }

  // scrollToBottom() {
  //   setTimeout(() => {
  //     this.content.scrollToBottom(300);
  //   }, 100);
  // }

  // formatDate(date:string){
  //   return new Date(date).toLocaleDateString('en-GB',{
  //     day:'numeric',
  //     month:'short'
  //   });
  // }

  // getStatus(status:string){
  //   switch(status){
  //     case 'read':
  //     return 'read';
  //     case 'delivered':
  //     return 'delivered';
  //     default:
  //     return 'sent';
  //   }
  // }

  

  // async openMenuModal() {
  //   const modal = await this.modalCtrl.create({
  //     component: ChatMenuComponent,
  //     componentProps: {
  //       isMuted: this.isMuted
  //     },
  //     cssClass: 'transparent-modal'
  //   });
  //   modal.onDidDismiss().then((res:any) => {
  //     if (!res.data) return;
  
  //     this.handleMenu(res.data);
  //   });
  //   await modal.present();
  // }

  // handleMenu(action: string) {
  //   switch(action){
  //     case 'info':
  //       this.showToast('Contact Info');
  //       break;
  //     case 'select':
  //       this.selectionMode = true;
  //       this.showToast('Select Mode ON');
  //       break;
  //     case 'mute':
  //       this.isMuted = !this.isMuted;
  //       this.showToast(this.isMuted ? 'Muted' : 'Unmuted');
  //       break;
  //     case 'wallpaper':
  //       this.changeWallpaper();
  //       break;
  //     case 'export':
  //       this.exportChat();
  //       break;
  //     case 'clear':
  //       this.clearChat();
  //       break;
  //     case 'block':
  //       this.showToast('Blocked');
  //       break;
  //     case 'report':
  //       this.showToast('Reported');
  //       break;
  //   }
  // }

  // sendMessage() {
  //   if (!this.newMessage.trim()) return;
  //   const now = new Date();
  //   const time = now.toLocaleTimeString([], {
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  //   // push new message
  //   this.messages.push({
  //     text: this.newMessage,
  //     sender: 'me',
  //     time: time
  //   });
  //   this.newMessage = '';
  //   setTimeout(() => {
  //     this.scrollToBottom();
  //   }, 100);
  // }

  // scrollToBottom() {
  //   this.content.scrollToBottom(300);
  // }

  // ✅ OPEN MENU
// async openMenu() {
//   const actionSheet = await this.actionSheetCtrl.create({
//     header: 'Options',
//     cssClass: 'whatsapp-menu',
//     buttons: [

//       {
//         text: 'Contact Info',
//         handler: () => {
//           this.showToast('Open Contact Info');
//         }
//       },
//       {
//         text: 'Select Messages',
//         handler: () => {
//           this.selectionMode = true;
//           this.showToast('Select messages enabled');
//         }
//       },
//       {
//         text: this.isMuted ? 'Unmute' : 'Mute',
//         handler: () => {
//           this.isMuted = !this.isMuted;
//           this.showToast(this.isMuted ? 'Chat muted' : 'Chat unmuted');
//         }
//       },
//       {
//         text: 'Wallpaper',
//         handler: () => {
//           this.changeWallpaper();
//         }
//       },
//       {
//         text: 'Export Chat',
//         handler: () => {
//           this.exportChat();
//         }
//       },
//       {
//         text: 'Clear Chat',
//         handler: () => {
//           this.clearChat();
//         }
//       },
//       {
//         text: 'Block Contact',
//         cssClass: 'danger',
//         handler: () => {
//           this.showToast('Contact blocked');
//         }
//       },
//       {
//         text: 'Report Contact',
//         cssClass: 'danger',
//         handler: () => {
//           this.showToast('Reported');
//         }
//       },
//       {
//         text: 'Cancel',
//         role: 'cancel'
//       }

//     ]
//   });

//   await actionSheet.present();
// }
// ✅ TOAST
// async showToast(msg: string) {
//   const toast = await this.toastCtrl.create({
//     message: msg,
//     duration: 1500,
//     position: 'bottom'
//   });
//   toast.present();
// }

// ✅ CLEAR CHAT
// async clearChat() {
//   const alert = await this.alertCtrl.create({
//     header: 'Clear Chat?',
//     message: 'All messages will be deleted',
//     buttons: [
//       {
//         text: 'Cancel',
//         role: 'cancel'
//       },
//       {
//         text: 'Clear',
//         handler: () => {
//           this.messages = [];
//         }
//       }
//     ]
//   });

//   await alert.present();
// }

// ✅ EXPORT CHAT
// exportChat() {
//   const data = this.messages.map(m => `${m.time} - ${m.text}`).join('\n');

//   const blob = new Blob([data], { type: 'text/plain' });
//   const url = window.URL.createObjectURL(blob);

//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'chat.txt';
//   a.click();
// }

// ✅ CHANGE WALLPAPER
// changeWallpaper() {
//   document.querySelector('.chat-bg')?.setAttribute(
//     'style',
//     "background: url('assets/images/whatsapp-bg.png')"
//   );
// }

// toggleSelect(msg:any){
//   if(!this.selectionMode) return;
//   msg.selected = !msg.selected;
//   if(msg.selected){
//     this.selectedMessages.push(msg);
//   } else {
//     this.selectedMessages = this.selectedMessages.filter(m => m !== msg);
//   }
// }

// goToTemplate() {
//   this.router.navigateByUrl('select-template');
// }
// onBack() {
//   this.router.navigateByUrl('home');
// }




// NEW

// openImage(url?: string | null ) {
//   if (!url) {
//     return;
//   }
//   window.open(url, '_blank');
// }

// downloadFile(url?: string | null, fileName?: string): void {

//   if (!url) {

//     this.commonService.showToastMessage(
//       'File not found.',
//       'toast-error',
//       '',
//       2000
//     );

//     return;
//   }

//   const link = document.createElement('a');

//   link.href = url;

//   link.target = '_blank';

//   if (fileName) {
//     link.download = fileName;
//   }

//   document.body.appendChild(link);

//   link.click();

//   document.body.removeChild(link);

// }

// downloadFile(url: string, fileName?: string) {

//   if (!url) {
//     return;
//   }

//   const link = document.createElement('a');
//   link.href = url;
//   link.download = fileName || 'download';
//   link.target = '_blank';
//   link.click();

// }



// openLocation(lat: number | undefined, lng: number | undefined): void {

//   if (!lat || !lng) {
//     return;
//   }

//   const url = `https://www.google.com/maps?q=${lat},${lng}`;

//   window.open(url, '_system');

// }

// callContact(number: string | undefined) {

//   if (!number) {
//     return;
//   }

//   window.open(`tel:${number}`, '_system');

// }

// saveContact(name: string | undefined, number: string | undefined): void {

//   if (!number) {

//     return;

//   }

//   const vcard =
// `BEGIN:VCARD
// VERSION:3.0
// FN:${name}
// TEL:${number}
// END:VCARD`;

//   const blob = new Blob(
//     [vcard],
//     { type: 'text/vcard' }
//   );

//   const url = URL.createObjectURL(blob);

//   const link = document.createElement('a');

//   link.href = url;

//   link.download = `${name}.vcf`;

//   link.click();

//   URL.revokeObjectURL(url);

// }

// openVideo(videoUrl: string): void {

//   if (!videoUrl) {
//     return;
//   }

//   window.open(videoUrl, '_blank');

// }

// playAudio(audio: HTMLAudioElement): void {

//   if (!audio) {
//     return;
//   }

//   audio.play();

// }

// stopAudio(audio: HTMLAudioElement): void {

//   if (!audio) {
//     return;
//   }

//   audio.pause();

//   audio.currentTime = 0;

// }

// onTemplateButtonClick(button: any): void {

//   if (!button) {
//     return;
//   }

//   switch (button.action_type) {

//     case 'URL':

//       window.open(button.action_value, '_blank');

//       break;

//     case 'PHONE_NUMBER':

//       window.open(
//         `tel:${button.action_value}`,
//         '_system'
//       );

//       break;

//     case 'QUICK_REPLY':

//       this.newMessage = button.action_value || button.label;

//       break;

//     case 'FLOW':

//       this.commonService.showToastMessage(
//         'Flow action clicked.',
//         'toast-success',
//         '',
//         2000
//       );

//       break;

//     default:

//       console.log(button);

//   }

// }

// getDocumentIcon(fileName: string): string {

//   if (!fileName) {

//     return 'document-text-outline';

//   }

//   const ext = fileName
//     .split('.')
//     .pop()
//     ?.toLowerCase();

//   switch (ext) {

//     case 'pdf':
//       return 'document-text-outline';

//     case 'xls':

//     case 'xlsx':

//     case 'csv':
//       return 'grid-outline';

//     case 'doc':

//     case 'docx':
//       return 'document-outline';

//     case 'ppt':

//     case 'pptx':
//       return 'easel-outline';

//     case 'zip':

//     case 'rar':
//       return 'archive-outline';

//     default:
//       return 'document-text-outline';

//   }

// }

// isImage(msg: ChatMessage): boolean {

//   return msg.message_type === 'image';

// }

// isVideo(msg: ChatMessage): boolean {

//   return msg.message_type === 'video';

// }

// isAudio(msg: ChatMessage): boolean {

//   return msg.message_type === 'audio';

// }

// isDocument(msg: ChatMessage): boolean {

//   return msg.message_type === 'document';

// }

// isLocation(msg: ChatMessage): boolean {

//   return msg.message_type === 'location';

// }

// isContact(msg: ChatMessage): boolean {

//   return msg.message_type === 'contacts';

// }
// getImageUrl(path: string | null | undefined): string {
//   if (!path) {
//     return '';
//   }

//   if (path.startsWith('http://') || path.startsWith('https://')) {
//     return path;
//   }

//   return this.imgURL + path;
// }

// getFileName(path: string | null | undefined): string {
//   if (!path) {
//     return 'Document';
//   }

//   return path.substring(path.lastIndexOf('/') + 1);
// }

// }