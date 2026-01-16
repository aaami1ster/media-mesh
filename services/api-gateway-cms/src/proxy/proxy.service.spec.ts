import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProxyService', () => {
  let service: ProxyService;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const mockHttpService = {
      request: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpService = module.get(HttpService);
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

      const result = await service.proxyToCms('GET', '/programs');

      expect(result).toEqual({ id: '1', title: 'Test' });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/programs'),
        }),
      );
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

      const result = await service.proxyToCms('POST', '/programs', { title: 'New Program' });

      expect(result).toEqual({ id: '1', title: 'New Program' });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { title: 'New Program' },
        }),
      );
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

      await service.proxyToCms('GET', '/programs', null, { Authorization: 'Bearer token' });

      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        }),
      );
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

      await expect(service.proxyToCms('GET', '/programs/999')).rejects.toThrow(HttpException);
    });

    it('should handle connection errors', async () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      };

      httpService.request.mockReturnValue(throwError(() => error));

      await expect(service.proxyToCms('GET', '/programs')).rejects.toThrow(HttpException);
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

      const result = await service.proxyToMetadata('GET', '/metadata/1');

      expect(result).toEqual({ id: '1' });
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

      const result = await service.proxyToMedia('GET', '/media/1');

      expect(result).toEqual({ id: '1' });
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

      const result = await service.proxyToIngest('GET', '/ingest/jobs/1');

      expect(result).toEqual({ id: '1' });
    });
  });
});
