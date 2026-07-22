import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') || 'bookmanager_jwt_secret',
    });
  }

  async validate(payload: { id: string; email: string; role: string }) {
    const user = await this.userModel.findById(payload.id).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
