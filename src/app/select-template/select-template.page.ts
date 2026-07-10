import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Common } from '../common';
import { User } from '../user';
import { Api } from '../api';

@Component({
  selector: 'app-select-template',
  templateUrl: './select-template.page.html',
  styleUrls: ['./select-template.page.scss'],
  standalone: false,
})
export class SelectTemplatePage implements OnInit {

  private _unsubscribeAll: Subject<any>;

  searchText: string = '';

  currentUser:any;
  templates: any =[];
  // templates = [
  //   { name: 'testing_button', type: 'MARKETING' },
  //   { name: 'test_new', type: 'MARKETING' },
  //   { name: 'hindi_template', type: 'MARKETING' },
  //   { name: 'test_temp_two', type: 'MARKETING' }
  // ];

  filteredTemplates = [...this.templates];

  constructor(private router: Router, private userService: User, private apiService: Api,
    private commonService: Common) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.load_template();
  }

  load_template() {
    this.commonService.presentLoading();
    this.apiService.load_template()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: any) => {console.log(response);
        this.templates = response.data;
        this.filteredTemplates = [...this.templates];
        this.commonService.dismissLoading();
      }, error => {
        this.commonService.dismissLoading();
        console.log(error);
      });
  }

  goBack() {
    this.router.navigate(['/chat-details']);
  }

  filterTemplates() {
    const value = this.searchText.toLowerCase().trim();
    if (!value) {
      this.filteredTemplates = [...this.templates];
      return;
    }
    this.filteredTemplates = this.templates.filter((t:any) =>
      t.name.toLowerCase().includes(value)
    );
  }

  selectTemplate(item: any) {
    console.log('Selected Template:', item);

    // 👉 navigate back with data (optional)
    this.router.navigate(['/template-preview'], {
      state: { template: item }
    });
  }

}
