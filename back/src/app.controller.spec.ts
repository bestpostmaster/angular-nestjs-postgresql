import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the application stack description', () => {
      expect(appController.getHello()).toBe(
        'NestJS.12.0.1.API/Angular.22/PrimeNJ.21.1.0/postgres:17-alpine/Node.js.22/TypeScript.6.0.2',
      );
    });
  });
});
