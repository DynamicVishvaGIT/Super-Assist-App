import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActionSheetController, AlertController, IonContent, ModalController, ToastController } from '@ionic/angular';
import { ChatMenuComponent } from '../chat-menu/chat-menu.component';
import { filter, Subject, takeUntil } from 'rxjs';
import { Api } from '../api';
import { Common } from '../common';
import { User } from '../user';

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
    private toastCtrl: ToastController, private userService: User, private commonService: Common, private apiService: Api) { 
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
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/chat-details') {
        const nav = this.router.getCurrentNavigation();
        this.chat = nav?.extras?.state?.['chat'];
        if(this.chat){
          this.contactName = this.chat.contacts__name ||''  ;
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
openContactDetail(contact: any): void {
  if (!contact) {
    return;
  }

  this.router.navigate(['/contact-detail'], {
    state: {
      contact: contact,
      chat: this.chat,
      contactName: this.contactName,
      recipientNo: this.recipientNo
    }
  });
}

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  get_message_list() {
    this.loading = true;
    this.commonService.presentLoading();
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

goToTemplate() {
  this.router.navigateByUrl('select-template');
}
onBack() {
  this.router.navigateByUrl('home');
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
    // Existing call behavior intentionally left unchanged.
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