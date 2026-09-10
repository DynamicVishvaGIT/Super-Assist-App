import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatMenuComponent } from './chat-menu/chat-menu.component';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth-interceptor';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { File as CordovaFile } from '@awesome-cordova-plugins/file/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { FileTransfer } from '@awesome-cordova-plugins/file-transfer/ngx';


@NgModule({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent, ChatMenuComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ReactiveFormsModule,FormsModule, HttpClientModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, StatusBar, Keyboard, Camera,AppVersion,InAppBrowser,CordovaFile,FileOpener,SocialSharing,FileTransfer,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // 👈 add this
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
