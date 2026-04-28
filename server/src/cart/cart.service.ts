import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    return this.serializeCart(cart);
  }

  async getCart(userId: string) {
    const cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      return this.getOrCreateCart(userId);
    }
    return this.serializeCart(cart);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.ensureCartDocument(userId);
    const product = await this.productModel.findById(dto.productId).lean();

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Запрошенное количество превышает остаток');
    }

    const existingItem = cart.items.find(
      (item) => String(item.productId) === dto.productId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + dto.quantity;
      if (product.stock < nextQuantity) {
        throw new BadRequestException('Запрошенное количество превышает остаток');
      }
      existingItem.quantity = nextQuantity;
      existingItem.price = product.price;
    } else {
      cart.items.push({
        productId: product._id,
        quantity: dto.quantity,
        price: product.price,
      } as never);
    }

    await cart.save();
    return this.serializeCart(cart);
  }

  async updateItem(userId: string, productId: string, dto: UpdateCartItemDto) {
    const cart = await this.ensureCartDocument(userId);
    const item = cart.items.find((entry) => String(entry.productId) === productId);

    if (!item) {
      throw new NotFoundException('Товар в корзине не найден');
    }

    const product = await this.productModel.findById(productId).lean();
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Запрошенное количество превышает остаток');
    }

    item.quantity = dto.quantity;
    item.price = product.price;
    await cart.save();
    return this.serializeCart(cart);
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.ensureCartDocument(userId);
    cart.items = cart.items.filter((item) => String(item.productId) !== productId);
    await cart.save();
    return this.serializeCart(cart);
  }

  async clearCart(userId: string) {
    const cart = await this.ensureCartDocument(userId);
    cart.items = [];
    await cart.save();
    return this.serializeCart(cart);
  }

  private async ensureCartDocument(userId: string) {
    let cart = await this.cartModel.findOne({ userId });
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    return cart;
  }

  private async serializeCart(cart: CartDocument) {
    await cart.populate({
      path: 'items.productId',
      populate: [{ path: 'brand' }, { path: 'category' }],
    });

    const json = cart.toJSON() as Record<string, any>;
    return {
      ...json,
      items: (json.items ?? []).map((item: Record<string, any>) => ({
        productId: item.productId?.id ?? item.productId,
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: (json.items ?? []).reduce(
        (sum: number, item: Record<string, any>) => sum + item.price * item.quantity,
        0,
      ),
    };
  }
}
