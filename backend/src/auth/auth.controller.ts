import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  async discordAuth() {
    // Redirige vers Discord OAuth
  }

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  async discordCallback(@Req() req, @Res() res: Response) {
    const { access_token, user } = await this.authService.login(req.user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return req.user;
  }
}