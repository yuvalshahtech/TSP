/**
 * Step Controller for Algorithm Visualization
 * Manages step-by-step playback of algorithm execution
 * Enables play/pause/next/previous/replay/reset functionality
 */

class StepController {
  constructor() {
    // Step array: each element is { type, fromCity, toCity, metadata, explanation }
    this.steps = [];
    
    // Playback state
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.playbackSpeed = 500; // milliseconds between steps
    this.playbackInterval = null;
    
    // Algorithm context
    this.algorithmName = "";
    this.totalCities = 0;
    this.userRoute = [];
    
    // Callbacks for UI updates
    this.onStepChanged = null;
    this.onPlaybackStateChanged = null;
    this.onExplanationUpdated = null;
  }

  /**
   * Initialize step controller for new algorithm run
   */
  initialize(algorithmName, totalCities, userRoute = []) {
    this.clear();
    this.algorithmName = algorithmName;
    this.totalCities = totalCities;
    this.userRoute = userRoute;
    this.currentStepIndex = -1;
  }

  /**
   * Add a step to the sequence
   * @param {Object} step - Step object with type, fromCity, toCity, metadata, explanation
   */
  addStep(step) {
    if (!step.type) {
      console.error("Step must have a 'type' property", step);
      return;
    }
    this.steps.push(step);
  }

  /**
   * Add multiple steps at once
   */
  addSteps(stepsArray) {
    stepsArray.forEach(step => this.addStep(step));
  }

  /**
   * Advance to next step
   */
  next() {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this._notifyStepChanged();
      
      // Check if we reached final step - stop autoplay
      const currentStep = this.getCurrentStep();
      if (currentStep && ["final_result", "final"].includes(currentStep.type) && this.isPlaying) {
        this.pause();
      }
      
      return true;
    }
    return false;
  }

  /**
   * Go back to previous step
   */
  previous() {
    if (this.currentStepIndex > -1) {
      this.currentStepIndex--;
      this._notifyStepChanged();
      return true;
    }
    return false;
  }

  /**
   * Start playback
   */
  play() {
    if (this.isPlaying) return;
    if (this.currentStepIndex >= this.steps.length - 1) {
      // If at end, restart from beginning
      this.currentStepIndex = -1;
    }

    this.isPlaying = true;
    this._notifyPlaybackStateChanged();

    this.playbackInterval = setInterval(() => {
      if (!this.next()) {
        // Reached end, stop playback
        this.pause();
      }
    }, this.playbackSpeed);
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    this._notifyPlaybackStateChanged();
  }

  /**
   * Replay from beginning
   */
  replay() {
    this.pause();
    this.currentStepIndex = -1;
    this._notifyStepChanged();
    this.play();
  }

  /**
   * Reset to initial state (before any steps)
   */
  reset() {
    this.pause();
    this.currentStepIndex = -1;
    this._notifyStepChanged();
  }

  /**
   * Clear all steps and reset state
   */
  clear() {
    this.pause();
    this.steps = [];
    this.currentStepIndex = -1;
    this.algorithmName = "";
    this.totalCities = 0;
    this.userRoute = [];
  }

  /**
   * Set playback speed in milliseconds
   */
  setPlaybackSpeed(ms) {
    this.playbackSpeed = Math.max(100, ms);
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  /**
   * Get current step object
   */
  getCurrentStep() {
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentStepIndex];
  }

  /**
   * Get all steps from 0 to currentIndex (inclusive)
   * Used for rendering state reconstruction
   */
  getStepsUpToCurrent() {
    if (this.currentStepIndex < 0) {
      return [];
    }
    return this.steps.slice(0, this.currentStepIndex + 1);
  }

  /**
   * Get UI state for controls
   */
  getUIState() {
    const currentStep = this.getCurrentStep();
    const isFinalResult = currentStep && ["final_result", "final"].includes(currentStep.type);
    
    return {
      canPlay: !this.isPlaying && this.steps.length > 0 && !isFinalResult,
      canPause: this.isPlaying,
      canNext: !this.isPlaying && this.currentStepIndex < this.steps.length - 1,
      canPrevious: !this.isPlaying && this.currentStepIndex > -1,
      canReplay: !this.isPlaying && this.steps.length > 0,
      canReset: !this.isPlaying && (this.currentStepIndex >= 0 || this.steps.length > 0),
      isPlaying: this.isPlaying,
      currentIndex: this.currentStepIndex,
      totalSteps: this.steps.length,
      progressPercent: this.steps.length > 0 
        ? Math.round(((this.currentStepIndex + 1) / this.steps.length) * 100)
        : 0,
      isFinalResult: isFinalResult
    };
  }

  /**
   * Get explanation for current step
   */
  getCurrentExplanation() {
    const step = this.getCurrentStep();
    return step ? step.explanation : "";
  }

  /**
   * Private: notify that step changed
   */
  _notifyStepChanged() {
    if (this.onStepChanged) {
      this.onStepChanged(this.getCurrentStep(), this.getUIState());
    }
    if (this.onExplanationUpdated) {
      this.onExplanationUpdated(this.getCurrentExplanation());
    }
  }

  /**
   * Private: notify that playback state changed
   */
  _notifyPlaybackStateChanged() {
    if (this.onPlaybackStateChanged) {
      this.onPlaybackStateChanged(this.getUIState());
    }
  }

  /**
   * Get statistics about current progress
   */
  getStats() {
    return {
      algorithmName: this.algorithmName,
      totalCities: this.totalCities,
      totalSteps: this.steps.length,
      currentStep: this.currentStepIndex + 1,
      isPlaying: this.isPlaying,
      isComplete: this.currentStepIndex === this.steps.length - 1
    };
  }
}

export default StepController;
