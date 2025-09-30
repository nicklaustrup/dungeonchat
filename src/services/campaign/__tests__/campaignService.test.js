// Mock Firebase Firestore functions before importing the service
jest.mock('firebase/firestore', () => {
  const mockAddDoc = jest.fn();
  const mockSetDoc = jest.fn();
  const mockUpdateDoc = jest.fn();
  const mockGetDoc = jest.fn();
  const mockGetDocs = jest.fn();
  const mockCollection = jest.fn();
  const mockDoc = jest.fn();
  const mockQuery = jest.fn();
  const mockWhere = jest.fn();
  const mockOrderBy = jest.fn();
  const mockServerTimestamp = jest.fn();
  const mockArrayUnion = jest.fn();
  const mockIncrement = jest.fn();

  return {
    collection: mockCollection,
    addDoc: mockAddDoc,
    setDoc: mockSetDoc,
    updateDoc: mockUpdateDoc,
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    doc: mockDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    serverTimestamp: mockServerTimestamp,
    arrayUnion: mockArrayUnion,
    increment: mockIncrement,
    __mocks__: {
      mockAddDoc,
      mockSetDoc,
      mockUpdateDoc,
      mockGetDoc,
      mockGetDocs,
      mockCollection,
      mockDoc,
      mockQuery,
      mockWhere,
      mockOrderBy,
      mockServerTimestamp,
      mockArrayUnion,
      mockIncrement
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
  updateDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  increment
} = require('firebase/firestore');

describe('campaignService', () => {
  const mockFirestore = {};
  
  beforeEach(() => {
    jest.clearAllMocks();
    serverTimestamp.mockReturnValue({ _methodName: 'serverTimestamp' });
    arrayUnion.mockReturnValue({ _methodName: 'arrayUnion' });
    increment.mockReturnValue({ _methodName: 'increment' });
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
      const mockDmDoc = {
        exists: () => true,
        data: () => ({ username: 'testdm', displayName: 'Test DM' })
      };
      
      addDoc.mockResolvedValue(mockCampaignRef);
      setDoc.mockResolvedValue(undefined);
      getDoc.mockResolvedValue(mockDmDoc);
      collection.mockReturnValue('campaigns-collection');
      doc.mockReturnValue('doc-ref');

      const result = await createCampaign(mockFirestore, mockCampaignData, dmId);

      // Verify campaign creation
      expect(addDoc).toHaveBeenCalledWith('campaigns-collection', {
        ...mockCampaignData,
        dmId,
        dmName: 'testdm',
        currentPlayers: 1,
        members: [dmId],
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
      const mockDmDoc = {
        exists: () => false,
        data: () => ({})
      };
      getDoc.mockResolvedValue(mockDmDoc);
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
      // Mock getDocs for getCampaignMembers call
      const mockMembersSnapshot = {
        docs: []
      };
      getDocs.mockResolvedValue(mockMembersSnapshot);
      setDoc.mockResolvedValue(undefined);
      updateDoc.mockResolvedValue(undefined);
      doc.mockReturnValue('doc-ref');
      collection.mockReturnValue('collection-ref');
      query.mockReturnValue('query-ref');

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
          visibility: 'public',
          dmId: 'dm1'
        }) },
        { id: 'campaign2', data: () => ({ 
          name: 'Campaign 2', 
          status: 'active',
          visibility: 'public',
          dmId: 'dm2'
        }) }
      ];
      
      // Mock getDoc for DM profile lookups
      const mockDmDoc = {
        exists: () => false,
        data: () => ({})
      };
      
      getDocs.mockResolvedValue({ docs: mockDocs });
      getDoc.mockResolvedValue(mockDmDoc);
      query.mockReturnValue('query-ref');
      collection.mockReturnValue('campaigns-collection');
      where.mockReturnValue('where-clause');
      doc.mockReturnValue('doc-ref');

      const result = await searchCampaigns(mockFirestore);

      expect(query).toHaveBeenCalledWith(
        'campaigns-collection',
        'where-clause'
      );

      expect(result).toEqual([
        { id: 'campaign1', name: 'Campaign 1', status: 'recruiting', visibility: 'public', dmId: 'dm1', dmName: 'Unknown DM' },
        { id: 'campaign2', name: 'Campaign 2', status: 'active', visibility: 'public', dmId: 'dm2', dmName: 'Unknown DM' }
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
        { id: 'member1', data: () => ({ role: 'dm', userId: 'user1' }) },
        { id: 'member2', data: () => ({ role: 'player', userId: 'user2' }) }
      ];
      
      // Mock user profile document that doesn't exist
      const mockUserDoc = {
        exists: () => false,
        data: () => ({})
      };
      
      getDocs.mockResolvedValue({ docs: mockDocs });
      getDoc.mockResolvedValue(mockUserDoc);
      collection.mockReturnValue('members-collection');
      doc.mockReturnValue('doc-ref');

      const result = await getCampaignMembers(mockFirestore, 'campaign-id');

      expect(result).toEqual([
        { id: 'member1', role: 'dm', userId: 'user1', displayName: 'Unknown User' },
        { id: 'member2', role: 'player', userId: 'user2', displayName: 'Unknown User' }
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