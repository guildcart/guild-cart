import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const DiscordStrategy_base: new (...args: any[]) => any;
export declare class DiscordStrategy extends DiscordStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(accessToken: string, refreshToken: string, profile: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
}
export {};
