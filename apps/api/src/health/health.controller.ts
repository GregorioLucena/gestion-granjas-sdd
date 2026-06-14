import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      data: {
        status: 'ok',
        service: 'gestion-granjas',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
