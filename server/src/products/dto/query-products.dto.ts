import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

enum ProductSortField {
  PRICE = 'price',
  TITLE = 'title',
  POPULARITY = 'popularity',
  CREATED_AT = 'createdAt',
}

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryProductsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ enum: ProductSortField })
  @IsOptional()
  @IsEnum(ProductSortField)
  sortBy?: ProductSortField = ProductSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
