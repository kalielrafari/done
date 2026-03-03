import { Module } from '@nestjs/common'
import { DonationsModule } from './donations/donations.module'
import { StreetModule } from './street/street.module'

@Module({
  imports: [
    StreetModule,
    DonationsModule,
  ],
})
export class AppModule {}
