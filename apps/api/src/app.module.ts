import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeadSourcesModule } from './modules/lead-sources/lead-sources.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { LeadsModule } from './modules/leads/leads.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SalesEmployeesModule } from './modules/sales-employees/sales-employees.module';
import { ProductGroupsModule } from './modules/product-groups/product-groups.module';
import { SalesAllocationModule } from './modules/sales-allocation/sales-allocation.module';
import { InteractionLogsModule } from './modules/interaction-logs/interaction-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LeadSourcesModule,
    CampaignsModule,
    LeadsModule,
    WebhooksModule,
    SalesEmployeesModule,
    ProductGroupsModule,
    SalesAllocationModule,
    InteractionLogsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
