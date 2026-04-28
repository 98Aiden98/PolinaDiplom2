import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(180)
  deliveryAddress: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
