import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimeEntry {
  id: string;
  assignmentId: string;
  issueId: string;
  workerId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  status: 'active' | 'paused' | 'completed';
  pausedDuration: number; // total paused time in minutes
  breaks: Array<{
    id: string;
    startTime: string;
    endTime?: string;
    reason: string;
    duration?: number;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes: string[];
}

export interface TimeTrackingStats {
  totalWorkTime: number; // in minutes
  totalBreakTime: number; // in minutes
  averageWorkDuration: number; // in minutes
  completedSessions: number;
  efficiency: number; // percentage (work time / total time)
}

class TimeTrackingService {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly STORAGE_KEY = 'worker_time_entries';

  /**
   * Start time tracking for an assignment
   */
  async startTimeTracking(
    assignmentId: string,
    issueId: string,
    workerId: string,
    location?: any
  ): Promise<TimeEntry> {
    const timeEntry: TimeEntry = {
      id: `time_${Date.now()}`,
      assignmentId,
      issueId,
      workerId,
      startTime: new Date().toISOString(),
      status: 'active',
      pausedDuration: 0,
      breaks: [],
      location,
      notes: [],
    };

    // Save to storage
    await this.saveTimeEntry(timeEntry);

    // Start timer for real-time updates
    this.startTimer(timeEntry.id);

    console.log(`⏱️ Time tracking started for assignment: ${assignmentId}`);
    return timeEntry;
  }

  /**
   * Pause time tracking
   */
  async pauseTimeTracking(
    timeEntryId: string,
    reason: string = 'Break'
  ): Promise<TimeEntry | null> {
    const timeEntry = await this.getTimeEntry(timeEntryId);
    if (!timeEntry || timeEntry.status !== 'active') {
      return null;
    }

    const breakEntry = {
      id: `break_${Date.now()}`,
      startTime: new Date().toISOString(),
      reason,
    };

    timeEntry.status = 'paused';
    timeEntry.breaks.push(breakEntry);
    timeEntry.notes.push(`Work paused: ${reason} at ${new Date().toLocaleTimeString()}`);

    // Stop the active timer
    this.stopTimer(timeEntryId);

    await this.saveTimeEntry(timeEntry);
    console.log(`⏸️ Time tracking paused for: ${reason}`);
    return timeEntry;
  }

  /**
   * Resume time tracking
   */
  async resumeTimeTracking(timeEntryId: string): Promise<TimeEntry | null> {
    const timeEntry = await this.getTimeEntry(timeEntryId);
    if (!timeEntry || timeEntry.status !== 'paused') {
      return null;
    }

    // End the current break
    const currentBreak = timeEntry.breaks[timeEntry.breaks.length - 1];
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = new Date().toISOString();
      currentBreak.duration = this.calculateDuration(currentBreak.startTime, currentBreak.endTime);
      
      // Add to total paused duration
      timeEntry.pausedDuration += currentBreak.duration;
    }

    timeEntry.status = 'active';
    timeEntry.notes.push(`Work resumed at ${new Date().toLocaleTimeString()}`);

    // Restart timer
    this.startTimer(timeEntryId);

    await this.saveTimeEntry(timeEntry);
    console.log(`▶️ Time tracking resumed`);
    return timeEntry;
  }

  /**
   * Complete time tracking
   */
  async completeTimeTracking(
    timeEntryId: string,
    notes?: string
  ): Promise<TimeEntry | null> {
    const timeEntry = await this.getTimeEntry(timeEntryId);
    if (!timeEntry) {
      return null;
    }

    // End any active break
    const currentBreak = timeEntry.breaks[timeEntry.breaks.length - 1];
    if (currentBreak && !currentBreak.endTime) {
      currentBreak.endTime = new Date().toISOString();
      currentBreak.duration = this.calculateDuration(currentBreak.startTime, currentBreak.endTime);
      timeEntry.pausedDuration += currentBreak.duration;
    }

    timeEntry.endTime = new Date().toISOString();
    timeEntry.duration = this.calculateDuration(timeEntry.startTime, timeEntry.endTime);
    timeEntry.status = 'completed';

    if (notes) {
      timeEntry.notes.push(`Work completed: ${notes}`);
    }

    // Stop timer
    this.stopTimer(timeEntryId);

    await this.saveTimeEntry(timeEntry);
    console.log(`✅ Time tracking completed. Duration: ${this.formatDuration(timeEntry.duration)}`);
    return timeEntry;
  }

  /**
   * Add a note to time entry
   */
  async addNote(timeEntryId: string, note: string): Promise<boolean> {
    const timeEntry = await this.getTimeEntry(timeEntryId);
    if (!timeEntry) {
      return false;
    }

    timeEntry.notes.push(`${new Date().toLocaleTimeString()}: ${note}`);
    await this.saveTimeEntry(timeEntry);
    return true;
  }

  /**
   * Get current active time entry for a worker
   */
  async getActiveTimeEntry(workerId: string): Promise<TimeEntry | null> {
    const entries = await this.getAllTimeEntries();
    return entries.find(entry => 
      entry.workerId === workerId && 
      (entry.status === 'active' || entry.status === 'paused')
    ) || null;
  }

  /**
   * Get time entry by ID
   */
  async getTimeEntry(timeEntryId: string): Promise<TimeEntry | null> {
    const entries = await this.getAllTimeEntries();
    return entries.find(entry => entry.id === timeEntryId) || null;
  }

  /**
   * Get all time entries for a worker
   */
  async getWorkerTimeEntries(workerId: string): Promise<TimeEntry[]> {
    const entries = await this.getAllTimeEntries();
    return entries.filter(entry => entry.workerId === workerId);
  }

  /**
   * Get time entries for a specific assignment
   */
  async getAssignmentTimeEntries(assignmentId: string): Promise<TimeEntry[]> {
    const entries = await this.getAllTimeEntries();
    return entries.filter(entry => entry.assignmentId === assignmentId);
  }

  /**
   * Calculate time tracking statistics for a worker
   */
  async getTimeTrackingStats(workerId: string, dateRange?: { start: string; end: string }): Promise<TimeTrackingStats> {
    let entries = await this.getWorkerTimeEntries(workerId);
    
    // Filter by date range if provided
    if (dateRange) {
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    const completedEntries = entries.filter(entry => entry.status === 'completed');
    
    const totalWorkTime = completedEntries.reduce((total, entry) => {
      return total + (entry.duration || 0) - entry.pausedDuration;
    }, 0);

    const totalBreakTime = completedEntries.reduce((total, entry) => {
      return total + entry.pausedDuration;
    }, 0);

    const totalTime = totalWorkTime + totalBreakTime;
    const efficiency = totalTime > 0 ? (totalWorkTime / totalTime) * 100 : 0;
    const averageWorkDuration = completedEntries.length > 0 ? totalWorkTime / completedEntries.length : 0;

    return {
      totalWorkTime,
      totalBreakTime,
      averageWorkDuration,
      completedSessions: completedEntries.length,
      efficiency,
    };
  }

  /**
   * Get real-time duration for active time entry
   */
  getCurrentDuration(timeEntry: TimeEntry): number {
    if (!timeEntry.startTime) return 0;

    const startTime = new Date(timeEntry.startTime);
    const currentTime = new Date();
    const totalMinutes = Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Subtract paused time and current break time if paused
    let pausedTime = timeEntry.pausedDuration;
    
    if (timeEntry.status === 'paused') {
      const currentBreak = timeEntry.breaks[timeEntry.breaks.length - 1];
      if (currentBreak && !currentBreak.endTime) {
        const breakDuration = this.calculateDuration(currentBreak.startTime, new Date().toISOString());
        pausedTime += breakDuration;
      }
    }

    return Math.max(0, totalMinutes - pausedTime);
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Format duration with seconds for real-time display
   */
  formatDurationWithSeconds(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const seconds = Math.floor((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${mins}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Export time entries to CSV format
   */
  async exportTimeEntries(workerId: string, dateRange?: { start: string; end: string }): Promise<string> {
    let entries = await this.getWorkerTimeEntries(workerId);
    
    if (dateRange) {
      entries = entries.filter(entry => {
        const entryDate = new Date(entry.startTime);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    const csvHeader = 'Date,Assignment ID,Issue ID,Start Time,End Time,Duration (minutes),Break Time (minutes),Status,Notes\n';
    
    const csvRows = entries.map(entry => {
      const date = new Date(entry.startTime).toLocaleDateString();
      const startTime = new Date(entry.startTime).toLocaleTimeString();
      const endTime = entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : '';
      const duration = entry.duration || 0;
      const breakTime = entry.pausedDuration;
      const notes = entry.notes.join('; ').replace(/,/g, ';');
      
      return `${date},${entry.assignmentId},${entry.issueId},${startTime},${endTime},${duration},${breakTime},${entry.status},"${notes}"`;
    }).join('\n');

    return csvHeader + csvRows;
  }

  /**
   * Private methods
   */
  private startTimer(timeEntryId: string): void {
    // Clear existing timer
    this.stopTimer(timeEntryId);

    // Start new timer that updates every minute
    const timer = setInterval(async () => {
      const timeEntry = await this.getTimeEntry(timeEntryId);
      if (timeEntry && timeEntry.status === 'active') {
        // Timer is running, could trigger UI updates here
        console.log(`⏱️ Active work time: ${this.formatDuration(this.getCurrentDuration(timeEntry))}`);
      } else {
        // Stop timer if entry is no longer active
        this.stopTimer(timeEntryId);
      }
    }, 60000); // Update every minute

    this.activeTimers.set(timeEntryId, timer);
  }

  private stopTimer(timeEntryId: string): void {
    const timer = this.activeTimers.get(timeEntryId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(timeEntryId);
    }
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private async saveTimeEntry(timeEntry: TimeEntry): Promise<void> {
    try {
      const entries = await this.getAllTimeEntries();
      const existingIndex = entries.findIndex(entry => entry.id === timeEntry.id);
      
      if (existingIndex >= 0) {
        entries[existingIndex] = timeEntry;
      } else {
        entries.push(timeEntry);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  }

  private async getAllTimeEntries(): Promise<TimeEntry[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading time entries:', error);
      return [];
    }
  }

  /**
   * Clear all time entries (for testing/reset)
   */
  async clearAllTimeEntries(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      // Clear all active timers
      this.activeTimers.forEach(timer => clearInterval(timer));
      this.activeTimers.clear();
      console.log('All time entries cleared');
    } catch (error) {
      console.error('Error clearing time entries:', error);
    }
  }
}

export const timeTrackingService = new TimeTrackingService();
export default timeTrackingService;
