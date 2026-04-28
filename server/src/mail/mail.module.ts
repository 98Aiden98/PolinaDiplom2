import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailNotification, EmailNotificationSchema } from './schemas/email-notification.schema';
import { MailService } from './mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailNotification.name, schema: EmailNotificationSchema },
    ]),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
