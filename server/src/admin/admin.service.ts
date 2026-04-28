import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../orders/schemas/order.schema';
import { Product } from '../products/schemas/product.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async getDashboard() {
    const [users, products, orders, pendingOrders, revenueAggregation] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.productModel.countDocuments(),
        this.orderModel.countDocuments(),
        this.orderModel.countDocuments({ status: 'pending' }),
        this.orderModel.aggregate([
          {
            $match: {
              status: { $in: ['paid', 'processing', 'shipped', 'completed'] },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalPrice' },
            },
          },
        ]),
      ]);

    return {
      users,
      products,
      orders,
      pendingOrders,
      totalRevenue: revenueAggregation[0]?.totalRevenue ?? 0,
    };
  }
}
