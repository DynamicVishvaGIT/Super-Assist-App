import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-chat-menu',
  templateUrl: './chat-menu.component.html',
  styleUrls: ['./chat-menu.component.scss'],
  standalone: false,
})
export class ChatMenuComponent  implements OnInit {

  @Input() isMuted: boolean = false;

  constructor(private modalCtrl: ModalController) {}

  close() {
    this.modalCtrl.dismiss();
  }

  action(type: string) {
    this.modalCtrl.dismiss(type);
  }

  ngOnInit() {}

}
