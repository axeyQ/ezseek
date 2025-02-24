// frontend/src/app/api/reports/route.js
import connectDB from '../../../../../database/connectDB';
import { reportingService } from '../../../services/reportingService';

export async function POST(request) {
  try {
    await connectDB();
    const { reportType, startDate, endDate } = await request.json();
    
    let reportData;
    switch (reportType) {
      case 'sales':
        reportData = await reportingService.getSalesReport(startDate, endDate);
        break;
      case 'itemwise':
        reportData = await reportingService.getItemWiseSalesReport(startDate, endDate);
        break;
      case 'kot':
        reportData = await reportingService.getKOTReport(startDate, endDate);
        break;
      case 'customer':
        reportData = await reportingService.getCustomerAnalysisReport();
        break;
      default:
        return Response.json({ error: 'Invalid report type' }, { status: 400 });
    }
    
    return Response.json(reportData);
  } catch (error) {
    console.error('Report Generation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}