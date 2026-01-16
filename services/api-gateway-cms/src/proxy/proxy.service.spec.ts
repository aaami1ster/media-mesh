import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import {
  HttpRetryService,
  CircuitBreakerService,
  CircuitBreakerState,
} from '@mediamesh/shared';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProxyService', () => {
  let service: ProxyService;
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
      getState: jest.fn(() => 'CLOSED'),
    };

    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get(HttpService);
    httpRetryService = module.get(HttpRetryService);
    circuitBreakerService = module.get(CircuitBreakerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('proxyToCms', () => {
    it('should proxy GET request to CMS service', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1', title: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      const result = await service.proxyToCms('GET', '/programs');

      expect(result).toEqual({ id: '1', title: 'Test' });
      expect(httpRetryService.retry).toHaveBeenCalled();
      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('cms-service');
      expect(circuitBreakerService.recordSuccess).toHaveBeenCalledWith('cms-service');
    });

    it('should proxy POST request with data', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1', title: 'New Program' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      const result = await service.proxyToCms('POST', '/programs', { title: 'New Program' });

      expect(result).toEqual({ id: '1', title: 'New Program' });
      expect(httpRetryService.retry).toHaveBeenCalled();
    });

    it('should forward authorization headers', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      await service.proxyToCms('GET', '/programs', null, { Authorization: 'Bearer token' });

      expect(httpRetryService.retry).toHaveBeenCalled();
    });

    it('should throw HttpException on service error', async () => {
      const mockResponse: AxiosResponse = {
        data: { error: 'Not found' },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      await expect(service.proxyToCms('GET', '/programs/999')).rejects.toThrow(HttpException);
      expect(circuitBreakerService.recordFailure).toHaveBeenCalledWith('cms-service');
    });

    it('should handle connection errors', async () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };

      httpService.request.mockReturnValue(throwError(() => error));
      httpRetryService.retry.mockRejectedValue(error);

      await expect(service.proxyToCms('GET', '/programs')).rejects.toThrow(HttpException);
      expect(circuitBreakerService.recordFailure).toHaveBeenCalledWith('cms-service');
    });
  });

  describe('proxyToMetadata', () => {
    it('should proxy to metadata service', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      const result = await service.proxyToMetadata('GET', '/metadata/1');

      expect(result).toEqual({ id: '1' });
      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('metadata-service');
    });
  });

  describe('proxyToMedia', () => {
    it('should proxy to media service', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      const result = await service.proxyToMedia('GET', '/media/1');

      expect(result).toEqual({ id: '1' });
      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('media-service');
    });
  });

  describe('proxyToIngest', () => {
    it('should proxy to ingest service', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: '1' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.request.mockReturnValue(of(mockResponse));
      httpRetryService.retry.mockImplementation(async (fn) => await fn());

      const result = await service.proxyToIngest('GET', '/ingest/jobs/1');

      expect(result).toEqual({ id: '1' });
      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('ingest-service');
    });
  });

  describe('circuit breaker', () => {
    it('should reject request when circuit is open', async () => {
      circuitBreakerService.canExecute.mockReturnValue(false);
      circuitBreakerService.getState.mockReturnValue(CircuitBreakerState.OPEN);

      await expect(service.proxyToCms('GET', '/programs')).rejects.toThrow(HttpException);
      expect(circuitBreakerService.canExecute).toHaveBeenCalledWith('cms-service');
    });
  });
});
