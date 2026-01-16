import { Module } from '@nestjs/common';
import { DiscoveryResolver } from './resolvers/discovery.resolver';
import { ProxyModule } from '../proxy/proxy.module';

/**
 * GraphQL Module
 * 
 * Provides GraphQL resolvers and schema.
 */
@Module({
  imports: [ProxyModule],
  providers: [DiscoveryResolver],
})
export class GraphqlModule {}
