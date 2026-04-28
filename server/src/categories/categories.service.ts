import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { slugify } from '../common/utils/slug.util';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll() {
    const categories = await this.categoryModel.find().sort({ name: 1 });
    return categories.map((category) => category.toJSON());
  }

  create(dto: CreateCategoryDto) {
    return this.categoryModel.create({
      ...dto,
      slug: slugify(dto.name),
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          ...(dto.name ? { slug: slugify(dto.name) } : {}),
        },
        { new: true, runValidators: true },
      );

    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    return updated.toJSON();
  }

  async remove(id: string) {
    const deleted = await this.categoryModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Category not found');
    }
    return { message: 'Category deleted' };
  }
}
