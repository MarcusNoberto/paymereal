import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.model';
import { EmailService } from './email.service';
import { RabbitMQService } from './rabbitmq.service';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common';


@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<Document>,
    private readonly emailService: EmailService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    const user = createdUser.toObject() as User;
    await createdUser.save();
  
    // Send dummy email
    this.emailService.sendEmail(user.email);
  
    // Emit dummy RabbitMQ event
    this.rabbitMQService.emitEvent('UserCreated');
  
    return user;
  }
  
  

  async getUser(userId: string): Promise<User> {
    // Retrieve user data from external API
    const user = await axios.get(`https://reqres.in/api/users/${userId}`);
    return user.data;
  }

  async getAvatar(userId: string): Promise<string> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user instanceof User) {
    if (user.avatar) {
      // Retrieve the previously saved file from the database
      return user.avatar;
    } else {
      // Download the avatar image from the external API
      const response = await axios.get(`https://reqres.in/api/users/${userId}/avatar`, {
        responseType: 'arraybuffer',
      });

      // Save the image file as a plain file
      const fileName = `avatar_${userId}.png`;
      const filePath = path.join(__dirname, '..', 'avatars', fileName);
      fs.writeFileSync(filePath, response.data);

      // Save the file path in the user document
      user.avatar = filePath;
      await user.save();

      // Return the base64-encoded representation of the image
      const buffer = fs.readFileSync(filePath);
      const base64Image = this.getBase64EncodedImage(buffer);
      return base64Image;
    }
}
  }

  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user instanceof User) {
    if (user.avatar) {
      // Delete the stored file from the file system
      fs.unlinkSync(user.avatar);

      // Remove the avatar field from the user document
      user.avatar = undefined;
      await user.save();
    }
}
  }

  private getBase64EncodedImage(buffer: Buffer): string {
    const encodedImage = buffer.toString('base64');
    return encodedImage;
  }
}
