import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitMQService {
  emitEvent(payload: any): void {
    // Implement your logic to emit a RabbitMQ event here
    console.log('Emitting RabbitMQ event:', payload);
  }
}
