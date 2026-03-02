import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { contract } from '@subs/contracts';

@Controller()
export class AppController {
  @TsRestHandler(contract.health)
  async health() {
    return tsRestHandler(contract.health, async () => {
      return { status: 200 as const, body: { status: 'ok' } };
    });
  }
}
