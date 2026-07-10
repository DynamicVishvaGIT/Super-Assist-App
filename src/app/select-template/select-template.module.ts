import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectTemplatePageRoutingModule } from './select-template-routing.module';

import { SelectTemplatePage } from './select-template.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectTemplatePageRoutingModule
  ],
  declarations: [SelectTemplatePage]
})
export class SelectTemplatePageModule {}
