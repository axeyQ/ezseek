// src/ml/SalesPrediction.js
import Papa from 'papaparse';
import { mean, std } from 'mathjs';

class SalesPrediction {
  constructor() {
    this.trainedData = null;
    this.meanValues = {};
    this.stdValues = {};
  }

  // Preprocess data
  async preprocessData(data) {
    try {
      // Convert data into proper format
      const processedData = data.map(row => ({
        date: new Date(row.date),
        totalSales: parseFloat(row.totalSales),
        dayOfWeek: new Date(row.date).getDay(),
        month: new Date(row.date).getMonth(),
        isWeekend: [0, 6].includes(new Date(row.date).getDay()),
        isHoliday: this.isHoliday(new Date(row.date))
      }));

      // Calculate mean and standard deviation for numerical features
      this.meanValues.totalSales = mean(processedData.map(row => row.totalSales));
      this.stdValues.totalSales = std(processedData.map(row => row.totalSales));

      // Normalize numerical features
      return processedData.map(row => ({
        ...row,
        totalSales: (row.totalSales - this.meanValues.totalSales) / this.stdValues.totalSales,
      }));
    } catch (error) {
      console.error('Error preprocessing data:', error);
      throw error;
    }
  }

  // Train the model
  async train(historicalData) {
    try {
      // Preprocess the data
      const processedData = await this.preprocessData(historicalData);
      
      // Store the processed data for predictions
      this.trainedData = processedData;

      // Calculate seasonal patterns
      this.seasonalPatterns = {
        dayOfWeek: this.calculateDayOfWeekPattern(processedData),
        monthly: this.calculateMonthlyPattern(processedData)
      };

      return true;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  // Make predictions
  async predict(date) {
    if (!this.trainedData) {
      throw new Error('Model not trained yet');
    }

    try {
      const targetDate = new Date(date);
      
      // Get seasonal factors
      const dayOfWeekFactor = this.seasonalPatterns.dayOfWeek[targetDate.getDay()];
      const monthFactor = this.seasonalPatterns.monthly[targetDate.getMonth()];

      // Calculate base prediction using seasonal patterns
      let prediction = this.meanValues.totalSales * dayOfWeekFactor * monthFactor;

      // Adjust for weekends
      if ([0, 6].includes(targetDate.getDay())) {
        prediction *= 1.2; // 20% increase for weekends
      }

      // Adjust for holidays
      if (this.isHoliday(targetDate)) {
        prediction *= 1.3; // 30% increase for holidays
      }

      return prediction;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }

  // Calculate day of week patterns
  calculateDayOfWeekPattern(data) {
    const dayAverages = Array(7).fill(0).map((_, day) => {
      const dayData = data.filter(row => row.dayOfWeek === day);
      return dayData.length > 0 ? mean(dayData.map(row => row.totalSales)) : 1;
    });

    const avgSales = mean(dayAverages);
    return dayAverages.map(avg => avg / avgSales);
  }

  // Calculate monthly patterns
  calculateMonthlyPattern(data) {
    const monthAverages = Array(12).fill(0).map((_, month) => {
      const monthData = data.filter(row => row.month === month);
      return monthData.length > 0 ? mean(monthData.map(row => row.totalSales)) : 1;
    });

    const avgSales = mean(monthAverages);
    return monthAverages.map(avg => avg / avgSales);
  }

  // Helper function to check if a date is a holiday
  isHoliday(date) {
    // Add your holiday logic here
    // This is a simple example - you'd want to expand this
    const holidays = [
      '2024-01-01', // New Year's Day
      '2024-12-25', // Christmas
      // Add more holidays
    ];

    return holidays.includes(date.toISOString().split('T')[0]);
  }

  // Export model parameters
  exportModel() {
    return {
      meanValues: this.meanValues,
      stdValues: this.stdValues,
      seasonalPatterns: this.seasonalPatterns
    };
  }

  // Import model parameters
  importModel(modelParams) {
    this.meanValues = modelParams.meanValues;
    this.stdValues = modelParams.stdValues;
    this.seasonalPatterns = modelParams.seasonalPatterns;
  }
}

export default SalesPrediction;