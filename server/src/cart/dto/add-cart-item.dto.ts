import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
