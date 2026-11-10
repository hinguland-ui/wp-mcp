import { Global, Module } from '@nestjs/common';
import { WebsitesController, PluginController } from './websites.controller';
import { WebsitesService } from './websites.service';
import { WordPressClient } from './wordpress.client';

@Global()
@Module({
  controllers: [WebsitesController, PluginController],
  providers: [WebsitesService, WordPressClient],
  exports: [WebsitesService, WordPressClient],
})
export class WebsitesModule {}
