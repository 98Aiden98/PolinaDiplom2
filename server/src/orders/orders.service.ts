import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly cartService: CartService,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items.length) {
      throw new BadRequestException('Корзина пуста');
    }

    const items: Array<{
      productId: ProductDocument['_id'];
      title: string;
      price: number;
      quantity: number;
    }> = [];
    let totalPrice = 0;

    for (const cartItem of cart.items) {
      const product = await this.productModel.findById(cartItem.productId);

      if (!product) {
        throw new NotFoundException('Один из товаров больше не доступен');
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Недостаточно товара на складе: "${product.title}"`,
        );
      }

      product.stock -= cartItem.quantity;
      await product.save();

      items.push({
        productId: product._id,
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity,
      });
      totalPrice += product.price * cartItem.quantity;
    }

    const order = await this.orderModel.create({
      userId,
      items,
      totalPrice,
      deliveryAddress: dto.deliveryAddress,
      phone: dto.phone,
      comment: dto.comment ?? '',
      status: OrderStatus.PENDING,
    });

    await this.cartService.clearCart(userId);

    const user = await this.userModel.findById(userId).lean();
    if (user) {
      await this.mailService.sendOrderCreatedEmail(
        user.email,
        {
          orderId: String(order._id),
          totalPrice,
          customerName: user.name,
          customerEmail: user.email,
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          comment: order.comment,
          items: order.items.map((item) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          createdAt: order.createdAt,
        },
        userId,
      );
      await this.mailService.notifyAdminAboutOrder({
        orderId: String(order._id),
        totalPrice,
        customerName: user.name,
        customerEmail: user.email,
        deliveryAddress: order.deliveryAddress,
        phone: order.phone,
        comment: order.comment,
        items: order.items.map((item) => ({
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt,
      });
    }

    return order.toJSON();
  }

  findMyOrders(userId: string) {
    return this.orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .then((orders) => orders.map((order) => order.toJSON()));
  }

  findAll() {
    return this.orderModel
      .find()
      .populate('userId', 'email name phone role')
      .sort({ createdAt: -1 })
      .then((orders) => orders.map((order) => order.toJSON()));
  }

  async findOne(id: string, user: { userId: string; role: Role }) {
    const order = await this.orderModel.findById(id).populate(
      'userId',
      'email name phone role',
    );

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    const ownerId = String(
      (order.userId as any)?._id ?? (order.userId as any)?.id ?? order.userId,
    );

    if (user.role !== Role.ADMIN && ownerId !== user.userId) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return order.toJSON();
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    const previousStatus = order.status;
    order.status = dto.status;
    await order.save();

    if (dto.status === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const user = await this.userModel.findById(order.userId).lean();
    if (user) {
      await this.mailService.sendOrderStatusEmail(
        user.email,
        {
          orderId: String(order._id),
          totalPrice: order.totalPrice,
          customerName: user.name,
          customerEmail: user.email,
          deliveryAddress: order.deliveryAddress,
          phone: order.phone,
          comment: order.comment,
          items: order.items.map((item) => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
          status: dto.status,
          createdAt: order.createdAt,
        },
        String(order.userId),
      );
    }

    return order.toJSON();
  }
}
