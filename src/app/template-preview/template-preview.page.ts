import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../user';
import { Api } from '../api';
import { Common } from '../common';

@Component({
  selector: 'app-template-preview',
  templateUrl: './template-preview.page.html',
  styleUrls: ['./template-preview.page.scss'],
  standalone: false,
})
export class TemplatePreviewPage implements OnInit {

  private _unsubscribeAll: Subject<any>;

  template: any;
  template_data:any;
  currentTime: string = '';

  constructor(private router: Router, private userService: User, private apiService: Api,private commonService: Common) {
    this._unsubscribeAll = new Subject();
    const nav = this.router.getCurrentNavigation();
    this.template = nav?.extras?.state?.['template'];
    console.log(this.template);
  }

  goBack() {
    this.router.navigate(['/select-template']);
  }

  // sendTemplate() {
  //   // 👉 Navigate back to chat details
  //   this.router.navigate(['/chat-details'], {
  //     state: { selectedTemplate: this.template }
  //   });
  // }

  ngOnInit() {
    this.get_template_data();
    this.setCurrentTime();
  }

  setCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  get_template_data() {
    this.commonService.presentLoading();
    this.apiService.get_template_data(this.template.id)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {console.log(response);
        this.template_data = response;
        this.commonService.dismissLoading();
      }, error => {
        this.commonService.dismissLoading();
        console.log(error);
      });
  }

  sendTemplate() {
    const payload: any = {
      // recipient_no: this.selectedContact?.mobileNo || this.mobileNo,
      message_type: 'template',
      template_id: this.template_data?.templates?.id,
      header_file_types: '',
      header_file: '',
      body_var_values: []
    };
    // If template has header image/video/document
    if (
      this.template_data?.templates?.header_type &&
      this.template_data.templates.header_type !== 'none'
    ) {
      payload.header_file_types = 'existing';
  
      payload.header_file =
        this.template_data?.templates?.header_media_file__header_media_file || '';
    }
    // If body variables exist
    if (
      this.template_data?.templates?.body_var_count &&
      Number(this.template_data.templates.body_var_count) > 0
    ) {
      payload.body_var_values =
        this.template_data?.templates?.body_var_values
          ? this.template_data.templates.body_var_values.split(',')
          : [];
    }
    console.log('Send Template Payload:', payload);
    this.commonService.presentLoading();
    this.apiService.send_messages(payload)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(
        (response: any) => {
          console.log(response);
          this.commonService.dismissLoading();
          this.commonService.showToastMessage('Template sent successfully','toast-success','',2000);
          this.goBack();
        },
        error => {
          console.log(error);
          this.commonService.dismissLoading();
          this.commonService.showToastMessage(error?.error?.message || 'Failed to send template','toast-error', '', 2000);
        }
      );
  }

}
