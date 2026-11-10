import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { updatePermissionsSchema } from '@wpconnect/shared';
import { CurrentUser, JwtAuthGuard, SessionUser } from '../../common/guards';
import { ZodPipe } from '../../common/zod.pipe';
import { PermissionsService } from './permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('v1')
export class PermissionsController {
  constructor(private readonly perms: PermissionsService) {}

  @Get('scopes')
  scopes() {
    return this.perms.allScopes();
  }

  @Get('permission-presets')
  presets(@CurrentUser() u: SessionUser) {
    return this.perms.listPresets(u.sub);
  }

  @Get('websites/:id/permissions')
  async get(@CurrentUser() u: SessionUser, @Param('id') id: string) {
    await this.perms.assertOwner(u.sub, id);
    return { scopes: await this.perms.list(id) };
  }

  @Put('websites/:id/permissions')
  async put(
    @CurrentUser() u: SessionUser,
    @Param('id') id: string,
    @Body(new ZodPipe(updatePermissionsSchema)) body: any,
  ) {
    return { scopes: await this.perms.setWebsiteScopes(u.sub, id, body) };
  }
}
