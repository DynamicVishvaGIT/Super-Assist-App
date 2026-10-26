import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PdfViewerPageRoutingModule } from './pdf-viewer-routing.module';

import { PdfViewerPage } from './pdf-viewer.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PdfViewerPageRoutingModule
  ],
  declarations: [PdfViewerPage]
})
export class PdfViewerPageModule {}
