import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Issue } from '../../types';

interface IssuesState {
  issues: Issue[];
  userIssues: Issue[];
  departmentIssues: Issue[];
  popularIssues: Issue[];
  loading: boolean;
  categories: string[];
}

const initialState: IssuesState = {
  issues: [],
  userIssues: [],
  departmentIssues: [],
  popularIssues: [],
  loading: false,
  categories: ['Potholes', 'Garbage', 'Trash Bins', 'Sanitation', 'Street Lights', 'Water Supply', 'Drainage'],
};

const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setIssues: (state, action: PayloadAction<Issue[]>) => {
      state.issues = action.payload;
    },
    addIssue: (state, action: PayloadAction<Issue>) => {
      state.issues.push(action.payload);
      state.userIssues.push(action.payload);
    },
    updateIssue: (state, action: PayloadAction<Issue>) => {
      const index = state.issues.findIndex(issue => issue.id === action.payload.id);
      if (index !== -1) {
        state.issues[index] = action.payload;
      }
    },
    upvoteIssue: (state, action: PayloadAction<string>) => {
      const issue = state.issues.find(issue => issue.id === action.payload);
      if (issue) {
        issue.upvotes += 1;
      }
    },
    setUserIssues: (state, action: PayloadAction<Issue[]>) => {
      state.userIssues = action.payload;
    },
    setDepartmentIssues: (state, action: PayloadAction<Issue[]>) => {
      state.departmentIssues = action.payload;
    },
    setPopularIssues: (state, action: PayloadAction<Issue[]>) => {
      state.popularIssues = action.payload;
    },
  },
});

export const {
  setLoading,
  setIssues,
  addIssue,
  updateIssue,
  upvoteIssue,
  setUserIssues,
  setDepartmentIssues,
  setPopularIssues,
} = issuesSlice.actions;

export default issuesSlice.reducer;
