import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { OrderStatus } from '../common/enums/order-status.enum';
import {
  EmailNotification,
  EmailNotificationDocument,
} from './schemas/email-notification.schema';

interface SendMailPayload {
  userId?: string;
  email: string;
  type: string;
  subject: string;
  text: string;
  html?: string;
}

interface OrderMailItem {
  title: string;
  price: number;
  quantity: number;
}

interface OrderMailDetails {
  orderId: string;
  totalPrice: number;
  customerName?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  phone?: string;
  comment?: string;
  items?: OrderMailItem[];
  status?: OrderStatus;
  createdAt?: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly mailFrom: string;
  private readonly adminEmail?: string;
  private readonly storeName = 'Diplom Home';

  constructor(
    configService: ConfigService,
    @InjectModel(EmailNotification.name)
    private readonly emailNotificationModel: Model<EmailNotificationDocument>,
  ) {
    const host = configService.get<string>('SMTP_HOST');
    const port = Number(configService.get<string>('SMTP_PORT', '587'));
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASS');

    this.mailFrom = configService.get<string>('MAIL_FROM', 'no-reply@example.com');
    this.adminEmail = configService.get<string>('ADMIN_EMAIL');

    this.transporter = host && user && pass
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  sendRegistrationEmail(email: string, name: string, userId?: string) {
    const subject = 'Добро пожаловать в Diplom Home';
    const greetingName = name?.trim() || 'покупатель';

    return this.sendMailRecord({
      userId,
      email,
      type: 'registration',
      subject,
      text: [
        `Здравствуйте, ${greetingName}.`,
        '',
        `Благодарим вас за регистрацию в интернет-магазине ${this.storeName}.`,
        'Ваш аккаунт успешно создан, и теперь вам доступны:',
        '- оформление заказов;',
        '- просмотр истории заказов;',
        '- отслеживание статуса заказов;',
        '- управление личными данными профиля.',
        '',
        'Если вы не регистрировались на сайте, просто проигнорируйте это письмо.',
        '',
        `С уважением,`,
        `команда ${this.storeName}`,
      ].join('\n'),
      html: this.buildEmailLayout({
        title: subject,
        greeting: `Здравствуйте, ${this.escapeHtml(greetingName)}.`,
        intro:
          `Благодарим вас за регистрацию в интернет-магазине ${this.storeName}. ` +
          'Ваш аккаунт успешно создан.',
        sections: [
          {
            title: 'Что доступно в личном кабинете',
            content:
              '<ul style="margin:0;padding-left:18px;color:#374151;">' +
              '<li>оформление заказов</li>' +
              '<li>просмотр истории заказов</li>' +
              '<li>отслеживание статусов заказов</li>' +
              '<li>управление данными профиля</li>' +
              '</ul>',
          },
        ],
        footer:
          'Если вы не регистрировались на сайте, просто проигнорируйте это письмо.',
      }),
    });
  }

  sendOrderCreatedEmail(
    email: string,
    details: OrderMailDetails,
    userId?: string,
  ) {
    const subject = `Ваш заказ №${details.orderId} успешно оформлен`;
    const customerName = details.customerName?.trim() || 'покупатель';

    return this.sendMailRecord({
      userId,
      email,
      type: 'order_created',
      subject,
      text: [
        `Здравствуйте, ${customerName}.`,
        '',
        `Ваш заказ №${details.orderId} успешно оформлен в интернет-магазине ${this.storeName}.`,
        `Статус заказа: ${this.getOrderStatusLabel(OrderStatus.PENDING)}.`,
        `Дата оформления: ${this.formatDate(details.createdAt)}.`,
        `Сумма заказа: ${this.formatPrice(details.totalPrice)}.`,
        details.deliveryAddress ? `Адрес доставки: ${details.deliveryAddress}.` : null,
        details.phone ? `Контактный телефон: ${details.phone}.` : null,
        details.comment ? `Комментарий к заказу: ${details.comment}.` : null,
        '',
        'Состав заказа:',
        ...this.buildItemsText(details.items),
        '',
        'Мы уведомим вас дополнительно, как только статус заказа изменится.',
        '',
        `С уважением,`,
        `команда ${this.storeName}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: this.buildOrderEmailHtml({
        title: subject,
        greeting: `Здравствуйте, ${this.escapeHtml(customerName)}.`,
        intro:
          `Ваш заказ №${this.escapeHtml(details.orderId)} успешно оформлен. ` +
          'Ниже указаны его основные данные.',
        details,
        statusLabel: this.getOrderStatusLabel(OrderStatus.PENDING),
        footer:
          'Мы обязательно сообщим вам, когда заказ будет передан в обработку, доставку или завершен.',
      }),
    });
  }

  sendOrderStatusEmail(
    email: string,
    details: OrderMailDetails,
    userId?: string,
  ) {
    const statusLabel = this.getOrderStatusLabel(details.status ?? OrderStatus.PENDING);
    const isCancelled = details.status === OrderStatus.CANCELLED;
    const subject = isCancelled
      ? `Заказ №${details.orderId} отменен`
      : `Статус заказа №${details.orderId} обновлен`;
    const customerName = details.customerName?.trim() || 'покупатель';

    return this.sendMailRecord({
      userId,
      email,
      type: isCancelled ? 'order_cancelled' : 'order_status',
      subject,
      text: [
        `Здравствуйте, ${customerName}.`,
        '',
        `Информируем вас об изменении статуса заказа №${details.orderId}.`,
        `Текущий статус: ${statusLabel}.`,
        `Дата оформления заказа: ${this.formatDate(details.createdAt)}.`,
        `Сумма заказа: ${this.formatPrice(details.totalPrice)}.`,
        details.deliveryAddress ? `Адрес доставки: ${details.deliveryAddress}.` : null,
        details.phone ? `Контактный телефон: ${details.phone}.` : null,
        '',
        isCancelled
          ? 'Заказ был отменен. Если отмена произошла по ошибке или вам нужна помощь с повторным оформлением, свяжитесь с нами.'
          : 'Мы продолжаем работу по вашему заказу и сообщим дополнительно о следующих изменениях.',
        '',
        `С уважением,`,
        `команда ${this.storeName}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: this.buildOrderEmailHtml({
        title: subject,
        greeting: `Здравствуйте, ${this.escapeHtml(customerName)}.`,
        intro: `Статус вашего заказа №${this.escapeHtml(details.orderId)} изменился.`,
        details,
        statusLabel,
        footer: isCancelled
          ? 'Если отмена произошла по ошибке, вы можете связаться с магазином и оформить заказ повторно.'
          : 'Мы сообщим вам дополнительно о следующих изменениях по заказу.',
      }),
    });
  }

  notifyAdminAboutOrder(details: OrderMailDetails) {
    if (!this.adminEmail) {
      this.logger.warn('ADMIN_EMAIL is not configured. Admin notification skipped.');
      return Promise.resolve(null);
    }

    const subject = `Новый заказ №${details.orderId}`;

    return this.sendMailRecord({
      email: this.adminEmail,
      type: 'admin_new_order',
      subject,
      text: [
        'Здравствуйте.',
        '',
        `В магазине ${this.storeName} оформлен новый заказ №${details.orderId}.`,
        `Дата оформления: ${this.formatDate(details.createdAt)}.`,
        `Покупатель: ${details.customerName || 'Не указано'}.`,
        `Email покупателя: ${details.customerEmail || 'Не указан'}.`,
        details.phone ? `Телефон: ${details.phone}.` : null,
        details.deliveryAddress ? `Адрес доставки: ${details.deliveryAddress}.` : null,
        details.comment ? `Комментарий: ${details.comment}.` : null,
        `Сумма заказа: ${this.formatPrice(details.totalPrice)}.`,
        '',
        'Состав заказа:',
        ...this.buildItemsText(details.items),
      ]
        .filter(Boolean)
        .join('\n'),
      html: this.buildOrderEmailHtml({
        title: subject,
        greeting: 'Здравствуйте.',
        intro: `В магазине ${this.storeName} оформлен новый заказ.`,
        details,
        statusLabel: this.getOrderStatusLabel(OrderStatus.PENDING),
        footer: 'Проверьте заказ в административной панели и при необходимости свяжитесь с покупателем.',
      }),
    });
  }

  private async sendMailRecord(payload: SendMailPayload) {
    const notification = await this.emailNotificationModel.create({
      userId: payload.userId ?? null,
      email: payload.email,
      type: payload.type,
      subject: payload.subject,
      status: 'pending',
    });

    try {
      await this.transporter.sendMail({
        from: this.mailFrom,
        to: payload.email,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });

      notification.status = 'sent';
      await notification.save();
      return notification.toJSON();
    } catch (error) {
      notification.status = 'failed';
      await notification.save();
      this.logger.error(`Failed to send email "${payload.subject}"`, error);
      return notification.toJSON();
    }
  }

  private buildOrderEmailHtml(params: {
    title: string;
    greeting: string;
    intro: string;
    details: OrderMailDetails;
    statusLabel: string;
    footer: string;
  }) {
    const { title, greeting, intro, details, statusLabel, footer } = params;
    const metaRows = [
      ['Номер заказа', details.orderId],
      ['Статус', statusLabel],
      ['Дата оформления', this.formatDate(details.createdAt)],
      ['Сумма заказа', this.formatPrice(details.totalPrice)],
      ['Адрес доставки', details.deliveryAddress || 'Не указан'],
      ['Телефон', details.phone || 'Не указан'],
      ['Комментарий', details.comment || 'Нет комментария'],
      ['Покупатель', details.customerName || 'Не указан'],
      ['Email', details.customerEmail || 'Не указан'],
    ];

    return this.buildEmailLayout({
      title,
      greeting,
      intro,
      sections: [
        {
          title: 'Детали заказа',
          content:
            '<table style="width:100%;border-collapse:collapse;">' +
            metaRows
              .map(
                ([label, value]) =>
                  '<tr>' +
                  `<td style="padding:8px 0;color:#6b7280;vertical-align:top;width:42%;">${this.escapeHtml(label)}</td>` +
                  `<td style="padding:8px 0;color:#111827;font-weight:600;">${this.escapeHtml(value)}</td>` +
                  '</tr>',
              )
              .join('') +
            '</table>',
        },
        details.items?.length
          ? {
              title: 'Состав заказа',
              content:
                '<table style="width:100%;border-collapse:collapse;">' +
                details.items
                  .map(
                    (item) =>
                      '<tr>' +
                      `<td style="padding:10px 0;color:#111827;">${this.escapeHtml(item.title)}</td>` +
                      `<td style="padding:10px 0;color:#6b7280;text-align:center;">${item.quantity} шт.</td>` +
                      `<td style="padding:10px 0;color:#111827;text-align:right;font-weight:600;">${this.escapeHtml(this.formatPrice(item.price * item.quantity))}</td>` +
                      '</tr>',
                  )
                  .join('') +
                '</table>',
            }
          : null,
      ].filter(Boolean) as Array<{ title: string; content: string }>,
      footer,
    });
  }

  private buildEmailLayout(params: {
    title: string;
    greeting: string;
    intro: string;
    sections: Array<{ title: string; content: string }>;
    footer: string;
  }) {
    const { title, greeting, intro, sections, footer } = params;

    return `
      <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="padding:28px 32px;background:#ef233c;color:#ffffff;">
            <div style="font-size:13px;opacity:.9;margin-bottom:8px;">${this.storeName}</div>
            <h1 style="margin:0;font-size:24px;line-height:1.3;">${this.escapeHtml(title)}</h1>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${greeting}</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">${this.escapeHtml(intro)}</p>
            ${sections
              .map(
                (section) => `
                  <div style="margin:0 0 20px;padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#f9fafb;">
                    <h2 style="margin:0 0 14px;font-size:16px;line-height:1.4;color:#111827;">${this.escapeHtml(section.title)}</h2>
                    <div style="font-size:14px;line-height:1.7;color:#374151;">${section.content}</div>
                  </div>
                `,
              )
              .join('')}
            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">${this.escapeHtml(footer)}</p>
            <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#111827;">
              С уважением,<br />
              команда ${this.storeName}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private buildItemsText(items: OrderMailItem[] = []) {
    if (!items.length) {
      return ['- Состав заказа отсутствует'];
    }

    return items.map(
      (item) =>
        `- ${item.title}: ${item.quantity} шт. x ${this.formatPrice(item.price)} = ${this.formatPrice(item.price * item.quantity)}`,
    );
  }

  private formatPrice(value: number) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDate(value?: Date) {
    if (!value) {
      return 'Не указана';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/Moscow',
    }).format(new Date(value));
  }

  private getOrderStatusLabel(status: OrderStatus) {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Принят и ожидает подтверждения',
      [OrderStatus.PAID]: 'Оплачен',
      [OrderStatus.PROCESSING]: 'Передан в обработку',
      [OrderStatus.SHIPPED]: 'Передан в доставку',
      [OrderStatus.COMPLETED]: 'Успешно выполнен',
      [OrderStatus.CANCELLED]: 'Отменен',
    };

    return labels[status] || status;
  }

  private escapeHtml(value: string) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
