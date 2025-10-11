import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateDiscordUser(profile: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        discordId: string;
        email: string | null;
        username: string;
        avatar: string | null;
    }>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            discordId: any;
            username: any;
            avatar: any;
        };
    }>;
}
