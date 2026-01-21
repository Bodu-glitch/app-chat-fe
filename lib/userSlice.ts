import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  name: string | null;
}

const initialState: UserState = {
  name: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setName(state: UserState, action: PayloadAction<string | null>) {
      state.name = action.payload && action.payload.trim() ? action.payload.trim() : null;
    },
    clearName(state: UserState) {
      state.name = null;
    },
  },
});

export const { setName, clearName } = userSlice.actions;
export default userSlice.reducer;
