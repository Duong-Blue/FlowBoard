import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { vi } from 'vitest';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(async () => {
    filter = new GlobalExceptionFilter();
  });

  it('should handle HttpException correctly', () => {
    const mockHttpException = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    
    filter.catch(mockHttpException, mockArgumentsHost);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(mockHttpException.getResponse());
  });

  it('should handle non-HttpException (Internal Server Error) correctly', () => {
    const mockError = new Error('Random error');
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    
    filter.catch(mockError, mockArgumentsHost);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
