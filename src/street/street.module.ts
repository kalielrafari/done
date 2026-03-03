import { Module } from '@nestjs/common'
import { StreetService } from './street.service'

@Module({
  providers: [StreetService],
  exports: [StreetService],
})
export class StreetModule {}
