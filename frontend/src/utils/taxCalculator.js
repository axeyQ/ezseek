// database/utils/taxCalculator.js

// Default tax configuration (should be moved to database/config later)
const DEFAULT_TAX_CONFIG = {
    GST: {
      CGST: 2.5,
      SGST: 2.5
    },
    SERVICE_TAX: {
      dineIn: 5,
      delivery: 0,
      takeaway: 0
    }
  };
  
  export const calculateTax = async (amount, orderType) => {
    try {
      // In a real implementation, we would fetch tax configuration from database
      const taxConfig = DEFAULT_TAX_CONFIG;
      
      const taxDetails = [];
      let totalTax = 0;
  
      // Calculate GST
      const cgst = (amount * taxConfig.GST.CGST) / 100;
      const sgst = (amount * taxConfig.GST.SGST) / 100;
      
      taxDetails.push({
        name: 'CGST',
        percentage: taxConfig.GST.CGST,
        amount: cgst
      });
      
      taxDetails.push({
        name: 'SGST',
        percentage: taxConfig.GST.SGST,
        amount: sgst
      });
  
      totalTax += cgst + sgst;
  
      // Add service tax for dine-in orders
      if (orderType === 'dineIn') {
        const serviceTax = (amount * taxConfig.SERVICE_TAX.dineIn) / 100;
        taxDetails.push({
          name: 'Service Tax',
          percentage: taxConfig.SERVICE_TAX.dineIn,
          amount: serviceTax
        });
        totalTax += serviceTax;
      }
  
      return {
        taxDetails,
        totalTax
      };
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  };