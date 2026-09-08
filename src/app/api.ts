import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Common } from './common';
import { catchError, EMPTY, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  
  baseUrl = '';

  device_type='android';

  constructor(public httpClient: HttpClient, public commonService: Common) { 
    this.baseUrl = this.commonService.getBaseURL();
    // this.headers = this.commonService.getHeaders();
  }

  login(user:any) {
    return this.httpClient.post(this.baseUrl + 'login', user)
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  app_update() {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('device', this.device_type);
    // urlSearchParams.append('app_type', this.commonService.user_type);
    console.log(urlSearchParams.toString());
    return this.httpClient.get(this.baseUrl + 'app_update?'+urlSearchParams.toString())
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  conversation_list() {
    return this.httpClient.get(this.baseUrl + 'conversation_list')
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  load_contacts() {
    return this.httpClient.get(this.baseUrl + 'load_contacts')
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  open_contact_conversation(contact:any) {
    return this.httpClient.post(this.baseUrl + 'open_contact_conversation', contact)
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  } 

  customer_details(conv_id:string) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('conv_id', conv_id);
    return this.httpClient.get(this.baseUrl + 'customer_details?'+urlSearchParams.toString())
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  message_list(conv_id:string) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('conv_id', conv_id);
    return this.httpClient.get(this.baseUrl + 'message_list?'+urlSearchParams.toString())
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  send_messages(message:any) {
    return this.httpClient.post(this.baseUrl + 'send_messages', message)
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  } 

  load_country_codes() {
    return this.httpClient.get(this.baseUrl + 'load_country_codes')
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  add_new_contacts(contact:any) {
    return this.httpClient.post(this.baseUrl + 'add_new_contacts', contact)
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  } 

  load_profile() {
    return this.httpClient.get(this.baseUrl + 'load_profile')
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  load_template() {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('action', 'exclude_authentication');
    return this.httpClient.get(this.baseUrl + 'load_template?'+urlSearchParams.toString())
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  get_template_data(template_id: string) {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('template_id', template_id);
    return this.httpClient.get(this.baseUrl + 'get_template_data?'+urlSearchParams.toString())
    .pipe(
      retry(1),
      catchError(this.errorHandler)
    )
  }

  errorHandler(error: any) {
    console.log(error);
    let message = 'Something went wrong. Please try again later.';
    // No Internet / Network Error
    if (error.status === 0) {
      // message = 'No internet connection. Please check your network and try again.';
      message = 'Connection could not be established, Please try again later.';
      // return EMPTY; 
    }
    // Server errors
    else if (error.status >= 500) {
      message = 'Our server is currently unavailable. Please try again in a few minutes.';
    }
    // Unauthorized
    else if (error.status === 401) {
      message = 'Your session has expired. Please log in again.';
    }
    // Forbidden
    else if (error.status === 403) {
      message = 'You are not authorized to access this resource.';
    }
    // Not Found
    else if (error.status === 404) {
      message = 'Requested information could not be found.';
    }
    else if (error.status === 412) {
      message = error.error.message;
    }
    // Validation or API message
    else if (error.error?.error) {
      message = error.error.error;
    }
    // Generic message
    else if (error.message) {
      message = error.message;
    }
    return throwError(() => message);
  }

  // errorHandler(error: any = Response) {
  //   console.log(error);
  //   // Prefer message inside error.error.message if available
  //   let message = error?.error?.message || error?.error?.error || error?.message || 'Remote server unreachable. Please check your Internet connection.';
  //   return throwError(() => message);
  // }
}
