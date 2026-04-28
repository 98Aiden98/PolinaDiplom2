import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: { userId: string }) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  addItem(@CurrentUser() user: { userId: string }, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.userId, dto);
  }

  @Patch('items/:productId')
  updateItem(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.userId, productId, dto);
  }

  @Delete('items/:productId')
  removeItem(
    @CurrentUser() user: { userId: string },
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user.userId, productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: { userId: string }) {
    return this.cartService.clearCart(user.userId);
  }
}
