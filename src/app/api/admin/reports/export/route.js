import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Absensi from '@/models/Absensi';
import { getSessionUser } from '@/lib/auth';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check authorization
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = {};

    if (userId) {
      query.userId = userId;
    }

    // Handle date range or month/year filtering
    if (startDate && endDate) {
      // Date range mode
      const rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);

      query.tanggal = { $gte: rangeStart, $lte: rangeEnd };
    } else if (month && year) {
      // Month/Year mode
      const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.tanggal = { $gte: monthStart, $lte: monthEnd };
    }

    const absensiData = await Absensi.find(query)
      .populate('userId', 'name email')
      .sort({ tanggal: 1 });

    if (absensiData.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the selected period' },
        { status: 404 }
      );
    }

    // Create new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Absensi');

    // Set column widths
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Nama', key: 'nama', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Check In', key: 'checkIn', width: 12 },
      { header: 'Foto Check In', key: 'checkInPhoto', width: 25 },
      { header: 'Lokasi Check In', key: 'checkInLocation', width: 35 },
      { header: 'Check Out', key: 'checkOut', width: 12 },
      { header: 'Foto Check Out', key: 'checkOutPhoto', width: 25 },
      { header: 'Lokasi Check Out', key: 'checkOutLocation', width: 35 },
      { header: 'Durasi Kerja', key: 'durasi', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Laporan Harian', key: 'laporan', width: 40 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4169FF' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    let rowIndex = 2;
    for (let i = 0; i < absensiData.length; i++) {
      const item = absensiData[i];

      const row = worksheet.getRow(rowIndex);

      // Set row height to accommodate images (120 pixels)
      row.height = 90;

      // Add text data
      row.getCell(1).value = i + 1;
      row.getCell(2).value = new Date(item.tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      row.getCell(3).value = item.userId?.name || 'N/A';
      row.getCell(4).value = item.userId?.email || 'N/A';
      row.getCell(5).value = item.checkInTime
        ? new Date(item.checkInTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '-';
      row.getCell(7).value = item.checkInAddress || '-';
      row.getCell(8).value = item.checkOutTime
        ? new Date(item.checkOutTime).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : '-';
      row.getCell(10).value = item.checkOutAddress || '-';
      row.getCell(11).value = item.workDuration
        ? `${Math.floor(item.workDuration / 60)}j ${item.workDuration % 60}m`
        : '-';
      row.getCell(12).value = item.status || 'HADIR';
      row.getCell(13).value = item.dailyReport || '-';

      // Center align all cells
      for (let col = 1; col <= 13; col++) {
        row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        row.getCell(col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      // Add images if available
      if (item.checkInPhoto) {
        try {
          // Fetch the image from the base64 string or URL
          let imageBuffer;

          if (item.checkInPhoto.startsWith('data:image')) {
            // It's a base64 string
            const base64Data = item.checkInPhoto.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else if (item.checkInPhoto.startsWith('http')) {
            // It's a URL - fetch it
            const response = await fetch(item.checkInPhoto);
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }

          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'jpeg',
            });

            worksheet.addImage(imageId, {
              tl: { col: 5, row: rowIndex - 1 },
              ext: { width: 120, height: 90 },
              editAs: 'oneCell',
            });
          }
        } catch (error) {
          console.error('Error adding check-in image:', error);
          row.getCell(6).value = 'Error loading image';
        }
      } else {
        row.getCell(6).value = '-';
      }

      if (item.checkOutPhoto) {
        try {
          let imageBuffer;

          if (item.checkOutPhoto.startsWith('data:image')) {
            const base64Data = item.checkOutPhoto.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else if (item.checkOutPhoto.startsWith('http')) {
            const response = await fetch(item.checkOutPhoto);
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }

          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'jpeg',
            });

            worksheet.addImage(imageId, {
              tl: { col: 8, row: rowIndex - 1 },
              ext: { width: 120, height: 90 },
              editAs: 'oneCell',
            });
          }
        } catch (error) {
          console.error('Error adding check-out image:', error);
          row.getCell(9).value = 'Error loading image';
        }
      } else {
        row.getCell(9).value = '-';
      }

      rowIndex++;
    }

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename
    const filename = `Laporan_Absensi_${year || 'All'}_${month || 'All'}.xlsx`;

    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data: ' + error.message },
      { status: 500 }
    );
  }
}
