const mockNetInfo = {
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
};

module.exports = mockNetInfo;
module.exports.default = mockNetInfo;
