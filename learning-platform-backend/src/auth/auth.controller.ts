import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import { readStringCookie } from './cookie.util';
import { Public } from './public.decorator';
import type { AuthenticatedUser } from './auth.types';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(input);
    response.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      this.authService.getCookieOptions(),
    );
    return { data: { user: result.user, expiresAt: result.expiresAt } };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(input);
    response.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      this.authService.getCookieOptions(),
    );
    return { data: { user: result.user, expiresAt: result.expiresAt } };
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      readStringCookie(request, SESSION_COOKIE_NAME),
    );
    response.clearCookie(
      SESSION_COOKIE_NAME,
      this.authService.getExpiredCookieOptions(),
    );
    return { data: { loggedOut: true } };
  }

  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return { data: { user } };
  }
}
