import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ActionSheetController, AlertController, IonContent, ModalController, ToastController } from '@ionic/angular';
import { ChatMenuComponent } from '../chat-menu/chat-menu.component';
import { filter, Subject, takeUntil } from 'rxjs';
import { Api } from '../api';
import { Common } from '../common';
import { User } from '../user';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.page.html',
  styleUrls: ['./chat-box.page.scss'],
  standalone: false,
})
export class ChatBoxPage implements OnInit {
  private _unsubscribeAll: Subject<any>;

  @ViewChild(IonContent) content!: IonContent;
  // @ViewChild('content', { static: false }) content!: IonContent;
  currentUser:any;
  chat: any;
  recipientNo: string = '';
  newMessage: string = '';
  contactName: string = '';

  messages: any[] = [
    {
      text: 'Hello 👋',
      sender: 'other',
      time: '10:10 am'
    },
    {
      text: 'Hi, how are you?',
      sender: 'me',
      time: '10:11 am'
    },
    {
      text: 'I am good 😊',
      sender: 'other',
      time: '10:12 am'
    }
  ];
  isMuted = false;
  selectionMode = false;
  selectedMessages: any[] = [];
  showTemplateOnlyFooter = false;

  constructor(private router: Router, private modalCtrl: ModalController,private actionSheetCtrl: ActionSheetController,private alertCtrl: AlertController,
    private toastCtrl: ToastController, private userService: User, private commonService: Common, private apiService: Api) { 
    this._unsubscribeAll = new Subject();
    const nav = this.router.getCurrentNavigation();
    this.chat = nav?.extras?.state?.['chat'];
    this.contactName = this.chat.contacts__name;
    console.log(this.chat);
    this.checkConversationWindow(this.chat.last_in_message_at);
  }

  ngOnInit() {
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
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  get_message_list() {
    this.commonService.presentLoading();
    this.apiService.message_list(this.chat.id)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {console.log(response);
        this.commonService.dismissLoading();
        this.recipientNo = response.recipient_no;
        this.messages = response.data.map((item: any) => {
          const createdDate = new Date(item.created_at);
          let bodyText = '';
          if (item.message_type === 'template' && item.template) {
            bodyText = item.template.body_content || '';
            if (item.template.body_var_values) {
              const values = item.template.body_var_values.split(',');
              values.forEach((val: string, index: number) => {
                const regex = new RegExp(`{{${index + 1}}}`, 'g');
                bodyText = bodyText.replace(regex, val);
              });
            }
          } else {
            bodyText = item.text || '';
          }
          return {
            id: item.id,
            sender: item.direction === 'OUT' ? 'me' : 'other',
            text: bodyText,
            time: createdDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            displayDate: createdDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short'
            }),
            headerType: item.template?.header_type || '',
            headerText: item.template?.header_text || '',
            footer: item.template?.footer_content || '',
            mediaFile: item.template?.header_media_file || '',
            buttons: item.template?.buttons || []
          };
        });
        setTimeout(() => {
          this.scrollToBottom();
        }, 300);
      }, error => {
        console.log(error);
        this.commonService.dismissLoading();
      });
  }

  onTemplateButtonClick(button: any) {
    if (button.action_type === 'URL') {
      window.open(button.action_value, '_blank');
    }

    if (button.action_type === 'PHONE_NUMBER') {
      window.open(`tel:${button.action_value}`);
    }

    if (button.action_type === 'QUICK_REPLY') {
      this.newMessage = button.action_value;
    }

    if (button.action_type === 'FLOW') {
      this.showToast('Flow button clicked');
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[1].charAt(0)
    ).toUpperCase();
  }

  send_messages() {
    if (!this.newMessage || !this.newMessage.trim()) {
      this.commonService.showToastMessage('Message can not be empty.','toast-error','',2000);
      return;
    }
    const tempMessage = this.newMessage;
    const now = new Date();
    // Optional: show instantly in UI before API response
    this.messages.push({
      sender: 'me',
      text: tempMessage,
      time: now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      displayDate: now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      }),
      footer: 'Powered by dv',
      buttons: [],
      isLocal: true
    });
    this.newMessage = '';
    setTimeout(() => {
      this.scrollToBottom();
    }, 200);
    this.commonService.presentLoading();
    const message: any = {
      recipient_no: this.recipientNo,
      message_type: 'text',
      text_message: tempMessage
    };
    console.log(message);
    this.apiService.send_messages(message)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(
        (response: any) => {
          console.log(response);
          this.commonService.dismissLoading();
          // Optional: refresh message list after sending
          this.get_message_list();
        },
        respError => {
          console.log(respError);
          this.commonService.dismissLoading();
          // Remove failed local message if API fails
          this.messages = this.messages.filter(msg => msg.text !== tempMessage || !msg.isLocal);
          this.commonService.showToastMessage(respError,'toast-error','',4000);
        }
      );
  }

  checkConversationWindow(lastInMessageAt: string | null) {console.log(lastInMessageAt);
    // If no inbound message received
    if (!lastInMessageAt) {
      this.showTemplateOnlyFooter = true;
      return;
    }
    const lastMessageTime = new Date(lastInMessageAt).getTime();
    const currentTime = new Date().getTime();
    const hoursDifference = (currentTime - lastMessageTime) / (1000 * 60 * 60);
    this.showTemplateOnlyFooter = hoursDifference >= 24;
  }

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
    }, 300);
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
async showToast(msg: string) {
  const toast = await this.toastCtrl.create({
    message: msg,
    duration: 1500,
    position: 'bottom'
  });
  toast.present();
}

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
exportChat() {
  const data = this.messages.map(m => `${m.time} - ${m.text}`).join('\n');

  const blob = new Blob([data], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat.txt';
  a.click();
}

// ✅ CHANGE WALLPAPER
changeWallpaper() {
  document.querySelector('.chat-bg')?.setAttribute(
    'style',
    "background: url('assets/images/whatsapp-bg.png')"
  );
}

toggleSelect(msg:any){
  if(!this.selectionMode) return;
  msg.selected = !msg.selected;
  if(msg.selected){
    this.selectedMessages.push(msg);
  } else {
    this.selectedMessages = this.selectedMessages.filter(m => m !== msg);
  }
}

goToTemplate() {
  this.router.navigateByUrl('select-template');
}

  onBack() {
    this.router.navigateByUrl('home');
  }

}

