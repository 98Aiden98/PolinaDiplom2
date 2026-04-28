import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Role } from '../common/enums/role.enum';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument } from './schemas/review.schema';

const REVIEW_ALLOWED_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.COMPLETED,
];

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async findByProduct(productId: string) {
    await this.ensureProductExists(productId);

    const [items, stats] = await Promise.all([
      this.reviewModel
        .find({ productId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 }),
      this.reviewModel.aggregate([
        { $match: { productId: new Types.ObjectId(productId) } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = stats[0] ?? { averageRating: 0, reviewCount: 0 };

    return {
      items: items.map((item) => item.toJSON()),
      averageRating: Number(summary.averageRating?.toFixed(1) ?? 0),
      reviewCount: summary.reviewCount ?? 0,
    };
  }

  async getMyReviewState(productId: string, userId: string) {
    await this.ensureProductExists(productId);

    const [review, hasPurchased] = await Promise.all([
      this.reviewModel.findOne({ productId, userId }),
      this.hasPurchasedProduct(productId, userId),
    ]);

    return {
      hasPurchased,
      hasReview: Boolean(review),
      canReview: hasPurchased && !review,
      review: review ? review.toJSON() : null,
    };
  }

  async create(userId: string, dto: CreateReviewDto) {
    await this.ensureProductExists(dto.productId);

    const existing = await this.reviewModel.findOne({
      userId,
      productId: dto.productId,
    });

    if (existing) {
      throw new BadRequestException('Вы уже оставили отзыв для этого товара');
    }

    const hasPurchased = await this.hasPurchasedProduct(dto.productId, userId);
    if (!hasPurchased) {
      throw new ForbiddenException(
        'Оставить отзыв можно только после покупки этого товара',
      );
    }

    const review = await this.reviewModel.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });

    await this.syncProductRating(dto.productId);

    return review.toJSON();
  }

  async update(
    id: string,
    actor: { userId: string; role: Role },
    dto: UpdateReviewDto,
  ) {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    if (actor.role !== Role.ADMIN && String(review.userId) !== actor.userId) {
      throw new ForbiddenException('Недостаточно прав для изменения отзыва');
    }

    if (dto.productId && dto.productId !== String(review.productId)) {
      throw new BadRequestException('Нельзя менять товар у существующего отзыва');
    }

    if (typeof dto.rating === 'number') {
      review.rating = dto.rating;
    }
    if (dto.title) {
      review.title = dto.title;
    }
    if (dto.comment) {
      review.comment = dto.comment;
    }

    await review.save();
    await this.syncProductRating(String(review.productId));

    return review.toJSON();
  }

  private async ensureProductExists(productId: string) {
    const exists = await this.productModel.exists({ _id: productId });
    if (!exists) {
      throw new NotFoundException('Товар не найден');
    }
  }

  private async hasPurchasedProduct(productId: string, userId: string) {
    const order = await this.orderModel.exists({
      userId,
      status: { $in: REVIEW_ALLOWED_STATUSES },
      'items.productId': new Types.ObjectId(productId),
    });

    return Boolean(order);
  }

  async syncProductRating(productId: string) {
    const [summary] = await this.reviewModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$productId',
          rating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    await this.productModel.findByIdAndUpdate(productId, {
      rating: Number(summary?.rating?.toFixed(1) ?? 0),
      reviewCount: summary?.reviewCount ?? 0,
    });
  }
}
