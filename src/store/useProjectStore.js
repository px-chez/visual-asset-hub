import { create } from 'zustand';

const initialState = {
  versions: [],
  loading: false,
  pagination: { page: 1, limit: 10, hasMore: true },
  selectedVersion: null,
};

export const useProjectStore = create((set) => ({
  ...initialState,

  setVersions: (versions) => set({ versions }),
  addVersions: (newVersions) => set((state) => ({
    versions: [...state.versions, ...newVersions],
    pagination: {
      ...state.pagination,
      page: state.pagination.page + 1,
      hasMore: newVersions.length > 0,
    },
  })),
  setLoading: (loading) => set({ loading }),
  setPagination: (pagination) => set({ pagination }),
  resetProject: () => set(initialState),
}));