import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(1500)
  comment: string;
}
