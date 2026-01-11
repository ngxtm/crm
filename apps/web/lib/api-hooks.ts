import { useState, useEffect, useCallback } from 'react';
import { Lead, LeadSource, Campaign, lead_status, InteractionLog, interaction_type, ProductGroup, SalesEmployee, SalesAllocationRule } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useLeadSources() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/lead-sources`);
      if (!res.ok) throw new Error('Failed to fetch lead sources');
      const data = await res.json();
      setSources(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const addSource = async (source: Partial<LeadSource>) => {
    try {
      const res = await fetch(`${API_BASE}/lead-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      if (!res.ok) throw new Error('Failed to create lead source');
      await fetchSources();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateSource = async (id: number, source: Partial<LeadSource>) => {
    try {
      const res = await fetch(`${API_BASE}/lead-sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      if (!res.ok) throw new Error('Failed to update lead source');
      await fetchSources();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteSource = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/lead-sources/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete lead source');
      await fetchSources();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { sources, loading, error, addSource, updateSource, deleteSource, refetch: fetchSources };
}

export function useCampaigns(sourceId?: number) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const url = sourceId
        ? `${API_BASE}/campaigns?source_id=${sourceId}`
        : `${API_BASE}/campaigns`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sourceId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const addCampaign = async (campaign: Partial<Campaign>) => {
    try {
      console.log('Sending campaign data:', campaign);
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error('Campaign creation failed:', res.status, errorData);
        throw new Error(`Failed to create campaign: ${res.status} ${errorData}`);
      }

      await fetchCampaigns();
      return true;
    } catch (err: any) {
      console.error('Add campaign error:', err);
      setError(err.message);
      alert(`Lỗi khi tạo chiến dịch: ${err.message}`);
      return false;
    }
  };

  const updateCampaign = async (id: number, campaign: Partial<Campaign>) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error('Failed to update campaign');
      await fetchCampaigns();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteCampaign = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete campaign');
      await fetchCampaigns();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { campaigns, loading, error, addCampaign, updateCampaign, deleteCampaign, refetch: fetchCampaigns };
}

export function useLeads(filters?: { status?: lead_status; source_id?: number }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.source_id) params.set('source_id', String(filters.source_id));

      const res = await fetch(`${API_BASE}/leads?${params}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      const result = await res.json();
      setLeads(result.data || []);
      setCount(result.count || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.source_id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = async (id: number, status: lead_status) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update lead');
      await fetchLeads();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const convertLead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}/convert`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to convert lead');
      await fetchLeads();
      const result = await res.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addLead = async (lead: Partial<Lead>) => {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error('Failed to create lead');
      await fetchLeads();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateLead = async (id: number, lead: Partial<Lead>) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!res.ok) throw new Error('Failed to update lead');
      await fetchLeads();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteLead = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete lead');
      await fetchLeads();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getLeadById = async (id: number): Promise<Lead | null> => {
    try {
      const res = await fetch(`${API_BASE}/leads/${id}`);
      if (!res.ok) throw new Error('Failed to fetch lead');
      const lead = await res.json();
      return lead;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  return {
    leads,
    loading,
    error,
    count,
    updateLeadStatus,
    convertLead,
    addLead,
    updateLead,
    deleteLead,
    getLeadById,
    refetch: fetchLeads
  };
}

export function useProductGroups() {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/product-groups`);
      if (!res.ok) throw new Error('Failed to fetch product groups');
      const data = await res.json();
      setProductGroups(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductGroups();
  }, [fetchProductGroups]);

  return { productGroups, loading, error, refetch: fetchProductGroups };
}

export function useInteractionLogs(leadId?: number) {
  const [interactions, setInteractions] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    if (!leadId) {
      setInteractions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/interaction-logs?lead_id=${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch interactions');
      const data = await res.json();
      setInteractions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const addInteraction = async (interaction: Partial<InteractionLog>) => {
    try {
      const res = await fetch(`${API_BASE}/interaction-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interaction),
      });
      if (!res.ok) throw new Error('Failed to create interaction');
      await fetchInteractions();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return { interactions, loading, error, addInteraction, refetch: fetchInteractions };
}

export function useSalesAllocation() {
  const [allocations, setAllocations] = useState<SalesAllocationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sales-allocation`);
      if (!res.ok) throw new Error('Failed to fetch sales allocations');
      const data = await res.json();
      setAllocations(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const addAllocation = async (allocation: Partial<SalesAllocationRule>) => {
    try {
      const res = await fetch(`${API_BASE}/sales-allocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation),
      });
      if (!res.ok) throw new Error('Failed to create allocation');
      await fetchAllocations();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const updateAllocation = async (id: number, allocation: Partial<SalesAllocationRule>) => {
    try {
      const res = await fetch(`${API_BASE}/sales-allocation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allocation),
      });
      if (!res.ok) throw new Error('Failed to update allocation');
      await fetchAllocations();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteAllocation = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/sales-allocation/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete allocation');
      await fetchAllocations();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const autoDistribute = async () => {
    try {
      const res = await fetch(`${API_BASE}/sales-allocation/auto-distribute`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to auto-distribute');
      const result = await res.json();
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    allocations,
    loading,
    error,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    autoDistribute,
    refetch: fetchAllocations
  };
}

export function useSalesEmployees() {
  const [salesEmployees, setSalesEmployees] = useState<SalesEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/sales-employees`);
      if (!res.ok) throw new Error('Failed to fetch sales employees');
      const data = await res.json();
      setSalesEmployees(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesEmployees();
  }, [fetchSalesEmployees]);

  return { salesEmployees, loading, error, refetch: fetchSalesEmployees };
}
