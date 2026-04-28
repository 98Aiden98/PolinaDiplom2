import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify } from '../common/utils/slug.util';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>) {}

  async findAll() {
    const brands = await this.brandModel.find().sort({ name: 1 });
    return brands.map((brand) => brand.toJSON());
  }

  create(dto: CreateBrandDto) {
    return this.brandModel.create({
      ...dto,
      slug: slugify(dto.name),
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    const updated = await this.brandModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          ...(dto.name ? { slug: slugify(dto.name) } : {}),
        },
        { new: true, runValidators: true },
      );

    if (!updated) {
      throw new NotFoundException('Brand not found');
    }

    return updated.toJSON();
  }

  async remove(id: string) {
    const deleted = await this.brandModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Brand not found');
    }
    return { message: 'Brand deleted' };
  }
}
