import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { PublicPlansController } from './public-plans.controller';

@Module({ controllers: [BillingController, PublicPlansController] })
export class BillingModule {}
