import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { StreetService } from '../street/street.service';
import { UtmifyService } from '../street/utmify.service'; // Importação do serviço

@Module({
  controllers: [DonationsController],
  providers: [
    DonationsService, 
    StreetService, 
    UtmifyService // Adicione esta linha aqui para resolver o erro!
  ],
})
export class DonationsModule {}