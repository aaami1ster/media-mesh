import { Test, TestingModule } from '@nestjs/testing';
import { CmsController } from './cms.controller';
import { ProxyService } from '../proxy.service';
import { JwtAuthGuard, RolesGuard } from '@mediamesh/shared';

describe('CmsController', () => {
  let controller: CmsController;
  let proxyService: jest.Mocked<ProxyService>;

  const mockUser = {
    id: 'user-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const mockProxyService = {
      proxyToCms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<CmsController>(CmsController);
    proxyService = module.get(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPrograms', () => {
    it('should proxy GET request to CMS service', async () => {
      const mockResponse = [{ id: '1', title: 'Test Program' }];
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getPrograms({}, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'GET',
        '/programs',
        null,
        expect.any(Object),
      );
    });
  });

  describe('getProgram', () => {
    it('should proxy GET request for specific program', async () => {
      const mockResponse = { id: '1', title: 'Test Program' };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getProgram('1', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'GET',
        '/programs/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('createProgram', () => {
    it('should proxy POST request to create program', async () => {
      const createDto = { title: 'New Program', description: 'Description' };
      const mockResponse = { id: '1', ...createDto };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.createProgram(createDto, mockRequest, mockUser);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'POST',
        '/programs',
        createDto,
        expect.any(Object),
      );
    });
  });

  describe('updateProgram', () => {
    it('should proxy PUT request to update program', async () => {
      const updateDto = { title: 'Updated Program' };
      const mockResponse = { id: '1', ...updateDto };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.updateProgram('1', updateDto, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'PUT',
        '/programs/1',
        updateDto,
        expect.any(Object),
      );
    });
  });

  describe('deleteProgram', () => {
    it('should proxy DELETE request to delete program', async () => {
      proxyService.proxyToCms.mockResolvedValue({});

      const mockRequest = {
        headers: {},
      } as any;

      await controller.deleteProgram('1', mockRequest);

      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'DELETE',
        '/programs/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('getEpisodes', () => {
    it('should proxy GET request for episodes', async () => {
      const mockResponse = [{ id: '1', title: 'Episode 1' }];
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getEpisodes({}, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalled();
    });

    it('should include query parameters when provided', async () => {
      const mockResponse = [{ id: '1' }];
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      await controller.getEpisodes({ programId: 'program-1' }, mockRequest);

      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'GET',
        expect.stringContaining('programId'),
        null,
        expect.any(Object),
      );
    });
  });

  describe('getEpisode', () => {
    it('should proxy GET request for specific episode', async () => {
      const mockResponse = { id: '1', title: 'Episode 1' };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.getEpisode('1', mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'GET',
        '/episodes/1',
        null,
        expect.any(Object),
      );
    });
  });

  describe('createEpisode', () => {
    it('should proxy POST request to create episode', async () => {
      const createDto = {
        programId: 'program-1',
        title: 'Episode 1',
        episodeNumber: 1,
      };
      const mockResponse = { id: '1', ...createDto };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.createEpisode(createDto, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'POST',
        '/episodes',
        createDto,
        expect.any(Object),
      );
    });
  });

  describe('updateEpisode', () => {
    it('should proxy PUT request to update episode', async () => {
      const updateDto = { title: 'Updated Episode' };
      const mockResponse = { id: '1', ...updateDto };
      proxyService.proxyToCms.mockResolvedValue(mockResponse);

      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.updateEpisode('1', updateDto, mockRequest);

      expect(result).toEqual(mockResponse);
      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'PUT',
        '/episodes/1',
        updateDto,
        expect.any(Object),
      );
    });
  });

  describe('deleteEpisode', () => {
    it('should proxy DELETE request to delete episode', async () => {
      proxyService.proxyToCms.mockResolvedValue({});

      const mockRequest = {
        headers: {},
      } as any;

      await controller.deleteEpisode('1', mockRequest);

      expect(proxyService.proxyToCms).toHaveBeenCalledWith(
        'DELETE',
        '/episodes/1',
        null,
        expect.any(Object),
      );
    });
  });
});
