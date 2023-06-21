import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  sendEmail(payload: any): void {
    // Implement your logic to send an email here
    console.log('Sending email:', payload);
  }
}
