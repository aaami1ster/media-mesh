import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import {
  HttpRetryService,
  CircuitBreakerService,
  CircuitBreakerState,
} from '@mediamesh/shared';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('Resilience Patterns (Integration)', () => {
  let proxyService: ProxyService;
  let httpService: jest.Mocked<HttpService>;
  let httpRetryService: jest.Mocked<HttpRetryService>;
  let circuitBreakerService: jest.Mocked<CircuitBreakerService>;

  beforeEach(async () => {
    const mockHttpService = {
      request: jest.fn(),
    };

    const mockHttpRetryService = {
      retry: jest.fn(),
    };

    const mockCircuitBreakerService = {
      canExecute: jest.fn(() => true),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
      getState: jest.fn(() => CircuitBreakerState.CLOSED),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: HttpRetryService,
          useValue: mockHttpRetryService,
        },
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreakerService,
        },
      ],
    }).compile();

    proxyService = moduleFixture.get<ProxyService>(ProxyService);
    httpService = moduleFixture.get(HttpService);
    httpRetryService = moduleFixture.get(HttpRetryService);
    circuitBreakerService = moduleFixture.get(CircuitBreakerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Circuit Breaker', () => {
    it('should check circuit breaker before making request', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1', title: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpRetryService.retry.mockResolvedValue(mockResponse);

      await proxyService.proxyToCms('GET', '/programs');

      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('cms-service');
    });

    it('should reject request when circuit is open', async () => {
      circuitBreakerService.canExecute.mockReturnValue(false);
      circuitBreakerService.getState.mockReturnValue(CircuitBreakerState.OPEN);

      await expect(proxyService.proxyToCms('GET', '/programs')).rejects.toThrow(
        HttpException,
      );

      expect(circuitBreakerService.canExecute).toHaveBeenCalled();
    });

    it('should record success after successful request', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpRetryService.retry.mockResolvedValue(mockResponse);

      await proxyService.proxyToCms('GET', '/programs');

      expect(circuitBreakerService.recordSuccess).toHaveBeenCalledWith('cms-service');
    });

    it('should record failure after failed request', async () => {
      const error = new HttpException('Service error', HttpStatus.INTERNAL_SERVER_ERROR);
      httpRetryService.retry.mockRejectedValue(error);

      await expect(proxyService.proxyToCms('GET', '/programs')).rejects.toThrow();

      expect(circuitBreakerService.recordFailure).toHaveBeenCalledWith('cms-service');
    });
  });

  describe('Retry with Exponential Backoff', () => {
    it('should use retry service for requests', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpRetryService.retry.mockResolvedValue(mockResponse);

      await proxyService.proxyToCms('GET', '/programs');

      expect(httpRetryService.retry).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };
      httpRetryService.retry.mockRejectedValue(error);

      await expect(proxyService.proxyToCms('GET', '/programs')).rejects.toThrow(
        HttpException,
      );

      expect(circuitBreakerService.recordFailure).toHaveBeenCalled();
    });

    it('should handle timeout errors gracefully', async () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };
      httpRetryService.retry.mockRejectedValue(error);

      await expect(proxyService.proxyToCms('GET', '/programs')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
