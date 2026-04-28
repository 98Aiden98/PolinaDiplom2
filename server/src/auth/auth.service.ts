import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CartService } from '../cart/cart.service';
import { Role } from '../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cartService: CartService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      passwordHash,
      role: Role.USER,
    });

    await this.cartService.getOrCreateCart(user.id);
    await this.mailService.sendRegistrationEmail(user.email, user.name, user.id);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const safeUser = this.usersService.sanitizeUser(user);
    return this.buildAuthResponse(safeUser as { id: string; email: string; role: Role });
  }

  me(userId: string) {
    return this.usersService.findOneOrFail(userId);
  }

  private buildAuthResponse(user: { id: string; email: string; role: Role }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }
}
