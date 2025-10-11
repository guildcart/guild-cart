import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateDiscordUser(profile: any) {
    const { id, username, email, avatar } = profile;
    
    let user = await this.usersService.findByDiscordId(id);
    
    if (!user) {
      user = await this.usersService.create({
        discordId: id,
        username,
        email,
        avatar,
      });
    } else {
      user = await this.usersService.update(user.id, {
        username,
        email,
        avatar,
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, discordId: user.discordId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }
}