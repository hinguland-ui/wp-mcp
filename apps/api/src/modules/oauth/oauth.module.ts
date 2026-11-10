import { Global, Module } from '@nestjs/common';
import { OAuthController, OAuthMetadataController, OAuthConsentController } from './oauth.controller';
import { OAuthService } from './oauth.service';

@Global()
@Module({
  controllers: [OAuthMetadataController, OAuthController, OAuthConsentController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
