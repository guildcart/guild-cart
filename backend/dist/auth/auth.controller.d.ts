import { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    discordAuth(): Promise<void>;
    discordCallback(req: any, res: Response): Promise<void>;
    getProfile(req: any): Promise<any>;
}
