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


@NgModule({
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  declarations: [AppComponent, ChatMenuComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ReactiveFormsModule,FormsModule, HttpClientModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, StatusBar, Keyboard, Camera,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // 👈 add this
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
