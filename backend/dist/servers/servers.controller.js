"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const servers_service_1 = require("./servers.service");
let ServersController = class ServersController {
    constructor(serversService) {
        this.serversService = serversService;
    }
    async create(req, body) {
        return this.serversService.create({
            ...body,
            ownerId: req.user.id,
        });
    }
    async findOne(id) {
        return this.serversService.findOne(id);
    }
    async findByDiscordId(discordServerId) {
        return this.serversService.findByDiscordId(discordServerId);
    }
    async update(id, req, body) {
        return this.serversService.update(id, req.user.id, body);
    }
    async getStats(id) {
        return this.serversService.getStats(id);
    }
};
exports.ServersController = ServersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('discord/:discordServerId'),
    __param(0, (0, common_1.Param)('discordServerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "findByDiscordId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServersController.prototype, "getStats", null);
exports.ServersController = ServersController = __decorate([
    (0, common_1.Controller)('servers'),
    __metadata("design:paramtypes", [servers_service_1.ServersService])
], ServersController);
//# sourceMappingURL=servers.controller.js.map