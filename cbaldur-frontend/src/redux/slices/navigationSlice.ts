import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface NavigationState {
  currentConfigName: string; // e.g., 'baldur'
  currentPanelIndex: number;
  totalPanels: number;
  isCompleted: boolean;
}

const initialState: NavigationState = {
  currentConfigName: 'baldur',
  currentPanelIndex: 0,
  totalPanels: 0,
  isCompleted: false,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCurrentConfig(
      state,
      action: PayloadAction<{ name: string; totalPanels: number }>,
    ) {
      state.currentConfigName = action.payload.name;
      state.totalPanels = action.payload.totalPanels;
      state.currentPanelIndex = 0;
      state.isCompleted = false;
    },

    setCurrentPanelIndex(state, action: PayloadAction<number>) {
      state.currentPanelIndex = Math.max(
        0,
        Math.min(action.payload, state.totalPanels),
      );
      state.isCompleted = state.currentPanelIndex >= state.totalPanels;
    },

    nextPanel(state) {
      if (state.currentPanelIndex < state.totalPanels) {
        state.currentPanelIndex += 1;
        state.isCompleted = state.currentPanelIndex >= state.totalPanels;
      }
    },

    previousPanel(state) {
      if (state.currentPanelIndex > 0) {
        state.currentPanelIndex -= 1;
        state.isCompleted = false;
      }
    },

    resetNavigation(state) {
      state.currentPanelIndex = 0;
      state.isCompleted = false;
    },
  },
});

export const {
  setCurrentConfig,
  setCurrentPanelIndex,
  nextPanel,
  previousPanel,
  resetNavigation,
} = navigationSlice.actions;

export default navigationSlice.reducer;
