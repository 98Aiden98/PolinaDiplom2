import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Role } from '../common/enums/role.enum';
import { User, UserDocument } from './schemas/user.schema';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

interface CreateUserParams {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: Role;
  address?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(payload: CreateUserParams) {
    const user = await this.userModel.create(payload);
    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async findByEmail(email: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    return user ? this.sanitizeUser(user.toJSON() as User & { id: string }) : null;
  }

  async findByEmailWithPassword(email: string) {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');

    return user
      ? (user.toJSON() as User & { id: string; passwordHash: string })
      : null;
  }

  async findOneOrFail(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async findAll() {
    const users = await this.userModel.find().sort({ createdAt: -1 });
    return users.map((user) =>
      this.sanitizeUser(user.toJSON() as User & { id: string }),
    );
  }

  async updateProfile(id: string, payload: Partial<User>) {
    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async updateRole(id: string, role: Role) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true, runValidators: true });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async createByAdmin(dto: CreateAdminUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 10),
      name: dto.name,
      phone: dto.phone ?? '',
      address: dto.address ?? '',
      role: dto.role,
    });

    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async updateByAdmin(id: string, dto: UpdateAdminUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
      if (existing && String(existing._id) !== id) {
        throw new BadRequestException('Пользователь с таким email уже существует');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.name) {
      user.name = dto.name;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    if (dto.address !== undefined) {
      user.address = dto.address;
    }
    if (dto.role) {
      user.role = dto.role;
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    await user.save();

    return this.sanitizeUser(user.toJSON() as User & { id: string });
  }

  async removeByAdmin(id: string, actorUserId: string) {
    if (id === actorUserId) {
      throw new BadRequestException('Нельзя удалить текущего авторизованного администратора');
    }

    const deleted = await this.userModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Пользователь не найден');
    }

    return { message: 'Пользователь удален' };
  }

  sanitizeUser<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
