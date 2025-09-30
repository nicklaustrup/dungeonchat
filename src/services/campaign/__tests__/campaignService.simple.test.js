// Simple service test without complex Firebase mocking
describe('campaignService basic functionality', () => {
  test('service module exports expected functions', () => {
    // Mock firebase before importing
    jest.doMock('firebase/firestore', () => ({
      collection: jest.fn(),
      addDoc: jest.fn(),
      setDoc: jest.fn(),
      getDoc: jest.fn(),
      getDocs: jest.fn(),
      doc: jest.fn(),
      query: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      serverTimestamp: jest.fn()
    }));

    const campaignService = require('../campaignService');
    
    expect(typeof campaignService.createCampaign).toBe('function');
    expect(typeof campaignService.joinCampaign).toBe('function');
    expect(typeof campaignService.searchCampaigns).toBe('function');
    expect(typeof campaignService.getCampaign).toBe('function');
    expect(typeof campaignService.getCampaignMembers).toBe('function');
    expect(typeof campaignService.getCampaignChannels).toBe('function');
  });

  test('createCampaign validates required parameters', async () => {
    jest.doMock('firebase/firestore', () => ({
      collection: jest.fn(),
      addDoc: jest.fn(),
      setDoc: jest.fn(),
      doc: jest.fn(),
      serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
    }));

    const { createCampaign } = require('../campaignService');
    
    // Test missing name/description first (since that's checked first in the service)
    await expect(createCampaign({}, {}, 'dm-id'))
      .rejects.toThrow('Campaign name and description are required');
    
    // Test missing DM ID
    await expect(createCampaign({}, { name: 'Test', description: 'Test' }, null))
      .rejects.toThrow('DM ID is required');
  });
});