export const createNavigationSlice = (set, get) => ({
  tabNow: 'explore',
  setTabNow: (tab) => {
    set({ tabNow: tab });
  },
});
