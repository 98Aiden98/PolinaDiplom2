import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  buildUploadedFileName,
  ensureDirectoryExists,
  productUploadsPath,
} from '../common/utils/file-upload.util';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', 8, {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          ensureDirectoryExists(productUploadsPath);
          callback(null, productUploadsPath);
        },
        filename: (_request, file, callback) => {
          callback(null, buildUploadedFileName(file.originalname));
        },
      }),
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(
            new BadRequestException('Можно загружать только изображения'),
            false,
          );
          return;
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFiles()
    files?: Array<{ filename: string; originalname: string }>,
  ) {
    if (!files?.length) {
      throw new BadRequestException('Файлы не были загружены');
    }

    return {
      files: files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        originalName: file.originalname,
      })),
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
