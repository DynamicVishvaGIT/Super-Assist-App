import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MediaDetailsPageRoutingModule } from './media-details-routing.module';

import { MediaDetailsPage } from './media-details.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MediaDetailsPageRoutingModule
  ],
  declarations: [MediaDetailsPage]
})
export class MediaDetailsPageModule {}
