// Mock Firebase Firestore functions before importing the service
jest.mock('firebase/firestore', () => {
  const mockAddDoc = jest.fn();
  const mockSetDoc = jest.fn();
  const mockGetDoc = jest.fn();
  const mockGetDocs = jest.fn();
  const mockCollection = jest.fn();
  const mockDoc = jest.fn();
  const mockQuery = jest.fn();
  const mockWhere = jest.fn();
  const mockOrderBy = jest.fn();
  const mockServerTimestamp = jest.fn();

  return {
    collection: mockCollection,
    addDoc: mockAddDoc,
    setDoc: mockSetDoc,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    doc: mockDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    serverTimestamp: mockServerTimestamp,
    __mocks__: {
      mockAddDoc,
      mockSetDoc,
      mockGetDoc,
      mockGetDocs,
      mockCollection,
      mockDoc,
      mockQuery,
      mockWhere,
      mockOrderBy,
      mockServerTimestamp
    }
  };
});

import { 
  createCampaign, 
  joinCampaign, 
  searchCampaigns, 
  getCampaign,
  getCampaignMembers,
  getCampaignChannels
} from '../campaignService';

// Get mocked functions
const {
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  serverTimestamp
} = require('firebase/firestore');

describe('campaignService', () => {
  const mockFirestore = {};
  
  beforeEach(() => {
    jest.clearAllMocks();
    serverTimestamp.mockReturnValue({ _methodName: 'serverTimestamp' });
  });

  describe('createCampaign', () => {
    const mockCampaignData = {
      name: 'Test Campaign',
      description: 'A test campaign',
      gameSystem: 'D&D 5e',
      maxPlayers: 6,
      visibility: 'public',
      tags: ['beginner-friendly'],
      settings: {
        allowSpectators: false,
        requireApproval: true,
        allowPlayerInvites: false
      }
    };
    const dmId = 'test-dm-id';

    test('creates campaign with all required data', async () => {
      const mockCampaignRef = { id: 'new-campaign-id' };
      addDoc.mockResolvedValue(mockCampaignRef);
      setDoc.mockResolvedValue(undefined);
      collection.mockReturnValue('campaigns-collection');
      doc.mockReturnValue('doc-ref');

      const result = await createCampaign(mockFirestore, mockCampaignData, dmId);

      // Verify campaign creation
      expect(addDoc).toHaveBeenCalledWith('campaigns-collection', {
        ...mockCampaignData,
        dmId,
        currentPlayers: 1,
        status: 'recruiting',
        createdAt: { _methodName: 'serverTimestamp' },
        updatedAt: { _methodName: 'serverTimestamp' },
        lastActivity: { _methodName: 'serverTimestamp' }
      });

      expect(result).toBe(mockCampaignRef);
    });

    test('throws error for missing required fields', async () => {
      await expect(createCampaign(mockFirestore, {}, dmId))
        .rejects.toThrow('Campaign name and description are required');

      await expect(createCampaign(mockFirestore, mockCampaignData, null))
        .rejects.toThrow('DM ID is required');
    });

    test('handles firestore errors', async () => {
      addDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(createCampaign(mockFirestore, mockCampaignData, dmId))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('joinCampaign', () => {
    const campaignId = 'test-campaign-id';
    const userId = 'test-user-id';
    const characterInfo = {
      characterName: 'Thorin',
      characterClass: 'Fighter'
    };

    test('successfully adds user to campaign', async () => {
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue('doc-ref');

      const result = await joinCampaign(mockFirestore, campaignId, userId, characterInfo);

      expect(setDoc).toHaveBeenCalledWith('doc-ref', {
        userId,
        role: 'player',
        status: 'active',
        joinedAt: { _methodName: 'serverTimestamp' },
        lastActive: { _methodName: 'serverTimestamp' },
        ...characterInfo
      });

      expect(result).toBe(true);
    });

    test('handles join campaign errors', async () => {
      setDoc.mockRejectedValue(new Error('Permission denied'));

      await expect(joinCampaign(mockFirestore, campaignId, userId))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('searchCampaigns', () => {
    test('returns public campaigns', async () => {
      const mockDocs = [
        { id: 'campaign1', data: () => ({ 
          name: 'Campaign 1', 
          status: 'recruiting',
          visibility: 'public'
        }) },
        { id: 'campaign2', data: () => ({ 
          name: 'Campaign 2', 
          status: 'active',
          visibility: 'public'
        }) }
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });
      query.mockReturnValue('query-ref');
      collection.mockReturnValue('campaigns-collection');
      where.mockReturnValue('where-clause');

      const result = await searchCampaigns(mockFirestore);

      expect(query).toHaveBeenCalledWith(
        'campaigns-collection',
        'where-clause'
      );

      expect(result).toEqual([
        { id: 'campaign1', name: 'Campaign 1', status: 'recruiting', visibility: 'public' },
        { id: 'campaign2', name: 'Campaign 2', status: 'active', visibility: 'public' }
      ]);
    });

    test('handles search errors', async () => {
      getDocs.mockRejectedValue(new Error('Network error'));
      query.mockReturnValue('query-ref');
      collection.mockReturnValue('campaigns-collection');

      await expect(searchCampaigns(mockFirestore))
        .rejects.toThrow('Network error');
    });
  });

  describe('getCampaign', () => {
    test('returns campaign data when found', async () => {
      const mockCampaignDoc = {
        exists: () => true,
        id: 'campaign-id',
        data: () => ({ name: 'Test Campaign' })
      };
      getDoc.mockResolvedValue(mockCampaignDoc);
      doc.mockReturnValue('doc-ref');

      const result = await getCampaign(mockFirestore, 'campaign-id');

      expect(result).toEqual({
        id: 'campaign-id',
        name: 'Test Campaign'
      });
    });

    test('throws error when campaign not found', async () => {
      const mockCampaignDoc = {
        exists: () => false
      };
      getDoc.mockResolvedValue(mockCampaignDoc);
      doc.mockReturnValue('doc-ref');

      await expect(getCampaign(mockFirestore, 'nonexistent-id'))
        .rejects.toThrow('Campaign not found');
    });
  });

  describe('getCampaignMembers', () => {
    test('returns campaign members', async () => {
      const mockDocs = [
        { id: 'member1', data: () => ({ role: 'dm' }) },
        { id: 'member2', data: () => ({ role: 'player' }) }
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });
      collection.mockReturnValue('members-collection');

      const result = await getCampaignMembers(mockFirestore, 'campaign-id');

      expect(result).toEqual([
        { id: 'member1', role: 'dm' },
        { id: 'member2', role: 'player' }
      ]);
    });
  });

  describe('getCampaignChannels', () => {
    test('returns campaign channels', async () => {
      const mockDocs = [
        { id: 'general', data: () => ({ name: 'General Chat' }) },
        { id: 'ooc', data: () => ({ name: 'Out of Character' }) }
      ];
      getDocs.mockResolvedValue({ docs: mockDocs });
      collection.mockReturnValue('channels-collection');

      const result = await getCampaignChannels(mockFirestore, 'campaign-id');

      expect(result).toEqual([
        { id: 'general', name: 'General Chat' },
        { id: 'ooc', name: 'Out of Character' }
      ]);
    });
  });
});