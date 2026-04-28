import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.search) {
      filter.title = { $regex: query.search, $options: 'i' };
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.brand) {
      filter.brand = query.brand;
    }

    if (typeof query.minPrice === 'number' || typeof query.maxPrice === 'number') {
      filter.price = {};
      if (typeof query.minPrice === 'number') {
        filter.price.$gte = query.minPrice;
      }
      if (typeof query.maxPrice === 'number') {
        filter.price.$lte = query.maxPrice;
      }
    }

    if (query.inStock) {
      filter.stock = { $gt: 0 };
    }

    if (query.isPopular) {
      filter.isPopular = true;
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price: { price: query.sortOrder === 'asc' ? 1 : -1 },
      title: { title: query.sortOrder === 'asc' ? 1 : -1 },
      popularity: {
        isPopular: -1,
        rating: query.sortOrder === 'asc' ? 1 : -1,
        createdAt: -1,
      },
      createdAt: { createdAt: query.sortOrder === 'asc' ? 1 : -1 },
    };

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('brand category')
        .sort(sortMap[query.sortBy ?? 'createdAt'])
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items: items.map((item) => item.toJSON()),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productModel.findById(id).populate('brand category');

    if (!product) {
      throw new NotFoundException('Товар не найден');
    }

    return product.toJSON();
  }

  create(dto: CreateProductDto) {
    return this.productModel.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      oldPrice: dto.oldPrice ?? null,
      brand: dto.brandId,
      category: dto.categoryId,
      images: dto.images ?? [],
      specifications: dto.specifications ?? [],
      stock: dto.stock ?? 0,
      rating: 0,
      reviewCount: 0,
      isPopular: dto.isPopular ?? false,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.productModel
      .findByIdAndUpdate(
        id,
        {
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.description ? { description: dto.description } : {}),
          ...(typeof dto.price === 'number' ? { price: dto.price } : {}),
          ...(dto.oldPrice !== undefined ? { oldPrice: dto.oldPrice } : {}),
          ...(dto.brandId ? { brand: dto.brandId } : {}),
          ...(dto.categoryId ? { category: dto.categoryId } : {}),
          ...(dto.images ? { images: dto.images } : {}),
          ...(dto.specifications ? { specifications: dto.specifications } : {}),
          ...(typeof dto.stock === 'number' ? { stock: dto.stock } : {}),
          ...(typeof dto.isPopular === 'boolean'
            ? { isPopular: dto.isPopular }
            : {}),
        },
        { new: true, runValidators: true },
      )
      .populate('brand category');

    if (!updated) {
      throw new NotFoundException('Товар не найден');
    }

    return updated.toJSON();
  }

  async remove(id: string) {
    const deleted = await this.productModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Товар не найден');
    }
    return { message: 'Товар удален' };
  }
}
