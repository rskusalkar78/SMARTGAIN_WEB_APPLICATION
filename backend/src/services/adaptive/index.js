/**
 * Adaptive Intelligence Service Module
 * Exports all adaptive intelligence functions for the SmartGain backend
 */

import {
  analyzeWeightTrend,
  analyzeOvertrainingPatterns,
  calculateCalorieAdjustment,
  calculateMacroAdjustments,
  calculateWorkoutAdjustments,
  analyzeProgressAndAdapt,
  createAdaptation,
  applyPendingAdaptations,
  generateAdaptationSummary
} from './adaptiveIntelligence.js';

export {
  // Progress Analysis
  analyzeWeightTrend,
  analyzeOvertrainingPatterns,
  
  // Adjustment Calculations
  calculateCalorieAdjustment,
  calculateMacroAdjustments,
  calculateWorkoutAdjustments,
  
  // Main Adaptive Functions
  analyzeProgressAndAdapt,
  createAdaptation,
  applyPendingAdaptations,
  
  // Utilities
  generateAdaptationSummary
};
