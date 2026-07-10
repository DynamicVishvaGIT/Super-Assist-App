import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TemplatePreviewPageRoutingModule } from './template-preview-routing.module';

import { TemplatePreviewPage } from './template-preview.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TemplatePreviewPageRoutingModule
  ],
  declarations: [TemplatePreviewPage]
})
export class TemplatePreviewPageModule {}
