import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = currentUser?.SESSION_ID || '';
    const publicEndpoints = [
      'login',
      'send_otp',
      'verify_otp',
      'forgot_password',
      'sign_up'
    ];
    const urlPath = req.url.split('?')[0];
    const isPublic = publicEndpoints.some(endpoint =>
      urlPath.endsWith(endpoint)
    );
    let modifiedReq = req;
    if (!isPublic) {
      // modifiedReq = req.clone({
      //   setHeaders: {
      //     Authorization: `${token}`,
      //     'device-type': 'mobile'
      //   }
      // });
      const headers: any = {};
      if (token) {
        headers['Authorization'] = token;
      }
      headers['device-type'] = 'mobile';
      modifiedReq = req.clone({
        setHeaders: headers
      });
    }
    return next.handle(modifiedReq);
  }
}