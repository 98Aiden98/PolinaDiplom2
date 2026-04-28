import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ProductSpecificationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  value: string;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  description: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oldPrice?: number;

  @ApiProperty()
  @IsMongoId()
  brandId: string;

  @ApiProperty()
  @IsMongoId()
  categoryId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [ProductSpecificationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPopular?: boolean;
}

export { ProductSpecificationDto };
