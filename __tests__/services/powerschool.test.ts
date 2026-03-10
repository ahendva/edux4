// __tests__/services/powerschool.test.ts — PowerSchool client unit tests
import { PowerSchoolClient } from '../../services/powerschool/client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PowerSchoolClient', () => {
  let client: PowerSchoolClient;

  beforeEach(() => {
    client = new PowerSchoolClient(
      'https://ps.example.com',
      'client_id',
      'client_secret',
    );
    mockFetch.mockClear();
  });

  it('authenticates and stores token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'test_token', expires_in: 3600 }),
    });

    await client.authenticate();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/oauth/access_token'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on authentication failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(client.authenticate()).rejects.toThrow();
  });

  it('fetches students with correct URL', async () => {
    // Mock auth
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tok', expires_in: 3600 }),
    });
    // Mock students response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        students: {
          student: [],
          '@count': 0,
          '@pagesize': 100,
          '@page': 1,
          '@pagecount': 1,
          '@recordcount': 0,
        },
      }),
    });

    await client.authenticate();
    const students = await client.getStudents(1);
    expect(students).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ws/v1/school/1/student'),
      expect.any(Object),
    );
  });
});
